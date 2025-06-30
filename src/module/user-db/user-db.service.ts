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
    const users = await this.userModel.find().exec();

    for (const user of users) {
      const phone = user.phonenumber;

      // 11자리 숫자이고 '-'가 없는 경우에만 처리
      if (/^010\d{8}$/.test(phone)) {
        const formattedPhone =
          phone.slice(0, 3) + '-' + phone.slice(3, 7) + '-' + phone.slice(7);

        // 이미 동일한 포맷으로 저장되어 있다면 스킵
        if (phone === formattedPhone) continue;

        user.phonenumber = formattedPhone;
        await user.save();
        console.log(`[Updated] ${phone} → ${formattedPhone}`);
      }
    }

    console.log('✅ 전화번호 포맷 일괄 업데이트 완료');
  }

  async create(createUserInput: CreateUserInput): Promise<UserDB | null> {
    let phone = createUserInput.phonenumber?.trim() || '';

    // 숫자만 추출
    const digitsOnly = phone.replace(/\D/g, '');

    // 11자리 숫자이면 010-XXXX-XXXX 포맷 적용
    if (/^010\d{8}$/.test(digitsOnly)) {
      phone = `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 7)}-${digitsOnly.slice(7)}`;
    }

    // 기존에 동일한 번호가 존재하면 저장하지 않음
    const existing = await this.userModel
      .findOne({ phonenumber: phone })
      .exec();
    if (existing) {
      return null;
    }

    // 새로운 사용자 생성
    const createdUser = new this.userModel({
      ...createUserInput,
      phonenumber: phone, // 변환된 번호 사용
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
      'sex',
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
    type?: string,
  ): Promise<{ users: UserDB[]; totalUsers: number }> {
    const user = await this.usersService.findUserById(userId);
    if (!user || !user.username) {
      throw new BadRequestException('Username not found for the user');
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
    type?: string,
  ): Promise<{ users: UserDB[]; totalUsers: number }> {
    const user = await this.usersService.findUserById(userId);
    if (!user || !user.username) {
      throw new BadRequestException('Username not found for the user');
    }

    const query: any = { manager: user.username };

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
    type?: string,
  ): Promise<{ users: UserDB[]; totalUsers: number }> {
    // ⬇️ 산하 + 본인 포함된 username 리스트 가져오기
    const usernames =
      await this.usersService.getUsernamesUnderMyNetwork(userId);

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
}
