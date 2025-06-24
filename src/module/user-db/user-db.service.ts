// src/module/user-db/user-db.service.ts

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserDB } from './user-db.schema';
import { Model } from 'mongoose';
import { CreateUserInput } from './dto/create-user.input';

@Injectable()
export class UserDbService {
  constructor(
    @InjectModel(UserDB.name) private readonly userModel: Model<UserDB>,
  ) {}

  async create(createUserInput: CreateUserInput): Promise<UserDB | null> {
    console.log('createUserInput.phonenumber:', createUserInput.phonenumber);
    const existing = await this.userModel
      .findOne({ phonenumber: createUserInput.phonenumber })
      .exec();

    if (existing) {
      // 중복된 휴대폰 번호가 있으면 생성하지 않음
      //throw new BadRequestException('[SKIP] 중복된 번호');
      return null;
    }

    const createdUser = new this.userModel(createUserInput);
    return createdUser.save();
  }

  async deleteUserById(id: string): Promise<boolean> {
    console.log('deleteUserById == id:', id);
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
}
