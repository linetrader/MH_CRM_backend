// src/module/user-db/user-db.service.ts

import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserDB } from './user-db.schema';
import { Model } from 'mongoose';
import { CreateUserInput } from './dto/create-user.input';
import { UsersService } from '../users/users.service';

@Injectable()
export class UserDbService implements OnModuleInit {
  constructor(
    @InjectModel(UserDB.name) private readonly userModel: Model<UserDB>,
    private readonly usersService: UsersService, // 👈 이 부분 추가
  ) {}

  async onModuleInit() {
    // 초기화 로직
    console.log('[UserDbService] onModuleInit called');
    //await this.initText();
    //await this.initMemo();
  }

  async initText() {
    console.log('[initText] 시작');

    const users = await this.userModel.find().exec();

    let updatedCount = 0;

    for (const user of users) {
      if (user.memo && (!user.sms || user.sms.trim() === '')) {
        user.sms = user.memo;
        await user.save();
        updatedCount++;
      }
    }

    console.log(
      `[initText] 완료: ${updatedCount}명의 사용자 sms 필드를 업데이트했습니다.`,
    );
  }

  async initMemo() {
    console.log('[initMemo] 시작');

    const users = await this.userModel.find().exec();
    let updatedCount = 0;

    for (const user of users) {
      if (user.memo && (!user.sms || user.sms.trim() === '')) {
        user.sms = user.memo;
      }

      // memo 필드는 무조건 "1."으로 초기화
      user.memo = '1.';
      await user.save();
      updatedCount++;
    }

    console.log(
      `[initMemo] 완료: ${updatedCount}명의 사용자 memo 필드를 초기화하고 sms 필드를 업데이트했습니다.`,
    );
  }

  async create(
    userId: string,
    createUserInput: CreateUserInput,
  ): Promise<UserDB | null> {
    let phone = createUserInput.phonenumber?.trim() || '';

    // 숫자만 추출
    let digitsOnly = phone.replace(/\D/g, '');

    // 10으로 시작하면 010으로 교체
    if (digitsOnly.startsWith('10')) {
      digitsOnly = '0' + digitsOnly;
    }

    // 010으로 시작하지 않으면 앞에 붙이기
    if (!digitsOnly.startsWith('010')) {
      digitsOnly = '010' + digitsOnly;
    }

    // 11자리 숫자인 경우 포맷 적용
    if (/^010\d{8}$/.test(digitsOnly)) {
      phone = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 7)}-${digitsOnly.slice(7)}`;
    } else {
      // 그 외는 하이픈 없이 저장
      phone = digitsOnly;
    }

    // memo가 비어 있으면 "1." 기본값 설정
    const memo = createUserInput.memo?.trim() || '1.';

    // manager가 비어 있으면 userId로 username을 가져와서 설정
    const username = await this.usersService.findUserNameByID(userId);
    createUserInput.manager = createUserInput.manager?.trim() || username;

    // 중복 체크
    const existing = await this.userModel
      .findOne({ phonenumber: phone })
      .exec();
    if (existing) {
      return null;
    }

    // 저장
    const createdUser = new this.userModel({
      ...createUserInput,
      phonenumber: phone,
      memo, // memo를 직접 지정
    });

    return createdUser.save();
  }

  async deleteUserById(id: string): Promise<boolean> {
    //console.log('deleteUserById == id:', id);
    const result = await this.userModel.deleteOne({ _id: id }).exec();
    return result.deletedCount === 1;
  }

  async findAll(
    limit = 30,
    offset = 0,
    includeSelf = true,
    type?: string,
  ): Promise<{ users: UserDB[]; totalUsers: number }> {
    const [users, totalUsers] = await Promise.all([
      this.userModel
        .find()
        .sort({ createdAt: -1 }) // 최신순
        .skip(offset)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments().exec(),
    ]);

    if (includeSelf) {
      console.log(
        'includeSelf is true, fetching all users including self',
        type,
      );
    }

    return { users, totalUsers };
  }

  async findOneByPhone(phonenumber: string): Promise<UserDB | null> {
    return this.userModel.findOne({ phonenumber }).exec();
  }

  async updateUserById(id: string, updates: Partial<UserDB>): Promise<UserDB> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new BadRequestException('User not found');

    const updatableFields: Array<keyof UserDB> = [
      'username',
      'phonenumber',
      'sms',
      'incomepath',
      'memo',
      'type',
      'manager',
    ];

    for (const field of updatableFields) {
      const value = updates[field];
      if (value !== undefined && value !== null && String(value).trim()) {
        (user[field] as any) = value;
      }
    }

    await user.save();
    return user;
  }

  async findUserDBsForMainUser(
    userId: string,
    limit = 30,
    offset = 0,
    includeSelf = true,
    type?: string,
  ): Promise<{ users: UserDB[]; totalUsers: number }> {
    const user = await this.usersService.findUserById(userId);
    if (!user || !user.username) {
      throw new BadRequestException('Username not found for the user');
    }

    if (includeSelf) {
      console.log(
        'includeSelf is true, fetching users under my network including self',
      );
    }

    const query: any = {
      $or: [{ manager: user.username }, { manager: '' }],
    };

    if (type) {
      query.type = type;
    }

    const [users, totalUsers] = await Promise.all([
      this.userModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(query).exec(),
    ]);

    return { users, totalUsers };
  }

  async findUserDBsByMyUsername(
    userId: string,
    limit = 30,
    offset = 0,
    includeSelf = true,
    type?: string,
  ): Promise<{ users: UserDB[]; totalUsers: number }> {
    const userName = await this.usersService.findUserNameByID(userId);

    if (includeSelf) {
      console.log(
        'includeSelf is true, fetching users under my network including self',
      );
    }

    const query: any = { manager: userName };

    if (type) {
      query.type = type;
    }

    const [users, totalUsers] = await Promise.all([
      this.userModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(query).exec(),
    ]);

    return { users, totalUsers };
  }

  async findUserDBsUnderMyNetwork(
    userId: string,
    limit = 30,
    offset = 0,
    includeSelf = true,
    type?: string,
  ): Promise<{ users: UserDB[]; totalUsers: number }> {
    // ⬇️ 산하 + 본인 포함된 username 리스트 가져오기
    let usernames: string[] = [];
    if (includeSelf) {
      usernames = await this.usersService.getUsernamesUnderMyNetwork(userId);
    } else {
      usernames = await this.usersService.getUsernamesFromMyNetwork(userId);
    }

    //console.log('type : ', type);
    //console.log('usernames : ', usernames);

    const query: any = {
      manager: { $in: usernames }, // ⬅️ 기존 userIds → usernames 로 변경
    };

    if (type) {
      query.type = type;
    }

    const [users, totalUsers] = await Promise.all([
      this.userModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(query).exec(),
    ]);

    return { users, totalUsers };
  }

  async searchUserDBsUnderMyNetworkWithOr(
    userId: string,
    limit = 30,
    offset = 0,
    filters: {
      username?: string;
      phonenumber?: string;
      incomepath?: string;
      creatorname?: string;
      manager?: string;
      type?: string;
    },
  ): Promise<{ users: UserDB[]; totalUsers: number }> {
    // console.log(
    //   'searchUserDBsUnderMyNetworkWithOr called with filters:',
    //   filters,
    // );
    // 1. 산하 username 목록 조회
    const usernames =
      await this.usersService.getUsernamesUnderMyNetwork(userId);

    // 2. 기본 조건: 산하 유저만 조회
    const baseCondition: any = {
      manager: { $in: usernames },
    };

    // 3. 필터된 OR 조건 구성
    const orConditions: any[] = [];

    if (filters.username) {
      orConditions.push({
        username: { $regex: filters.username, $options: 'i' },
      });
    }
    if (filters.phonenumber) {
      orConditions.push({
        phonenumber: { $regex: filters.phonenumber, $options: 'i' },
      });
    }
    if (filters.incomepath) {
      orConditions.push({
        incomepath: { $regex: filters.incomepath, $options: 'i' },
      });
    }
    if (filters.creatorname) {
      orConditions.push({
        creatorname: { $regex: filters.creatorname, $options: 'i' },
      });
    }
    if (filters.manager) {
      orConditions.push({
        manager: { $regex: filters.manager, $options: 'i' },
      });
    }

    // 최종 쿼리: AND (산하 조건 + optional type) + OR (검색 조건)
    const query: any = {
      ...baseCondition,
    };

    if (filters.type) {
      query.type = filters.type;
    }

    if (orConditions.length > 0) {
      query.$or = orConditions;
    }

    // 4. DB 조회
    const [users, totalUsers] = await Promise.all([
      this.userModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(query).exec(),
    ]);

    //console.log('searchUserDBsUnderMyNetworkWithOr query:', query);
    //console.log('searchUserDBsUnderMyNetworkWithOr users:', users);
    //console.log('searchUserDBsUnderMyNetworkWithOr totalUsers:', totalUsers);

    return { users, totalUsers };
  }
}
