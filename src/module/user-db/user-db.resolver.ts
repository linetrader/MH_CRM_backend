// src/module/user-db/user-db.resolver.ts

import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UserDbService } from './user-db.service';
import { UserDB } from './user-db.schema';
import { CreateUserInput, UserDBPagination } from './dto/create-user.input';

@Resolver(() => UserDB)
export class UserDbResolver {
  constructor(private readonly userDbService: UserDbService) {}

  @Mutation(() => UserDB, { nullable: true }) // nullable: true 필수
  async createUserDB(
    @Args('createUserInput') createUserInput: CreateUserInput,
  ): Promise<UserDB | null> {
    return this.userDbService.create(createUserInput);
  }

  @Mutation(() => Boolean)
  async deleteUserDB(@Args('id') id: string): Promise<boolean> {
    return this.userDbService.deleteUserById(id);
  }

  @Mutation(() => UserDB)
  async updateUserDB(
    @Args('id') id: string,
    @Args('username', { nullable: true }) username?: string,
    @Args('phonenumber', { nullable: true }) phonenumber?: string,
    @Args('sex', { nullable: true }) sex?: string,
    @Args('incomepath', { nullable: true }) incomepath?: string,
    @Args('memo', { nullable: true }) memo?: string,
    @Args('type', { nullable: true }) type?: string,
    @Args('manager', { nullable: true }) manager?: string,
  ): Promise<UserDB> {
    return this.userDbService.updateUserById(id, {
      username,
      phonenumber,
      sex,
      incomepath,
      memo,
      type,
      manager,
    });
  }

  @Query(() => UserDBPagination, { name: 'findAllUsers' })
  async findAll(
    @Args('limit', { type: () => Int, nullable: true }) limit = 30,
    @Args('offset', { type: () => Int, nullable: true }) offset = 0,
  ): Promise<UserDBPagination> {
    return this.userDbService.findAll(limit, offset);
  }

  @Query(() => UserDB, { name: 'findUserByPhone', nullable: true })
  async findOneByPhone(
    @Args('phonenumber') phonenumber: string,
  ): Promise<UserDB | null> {
    return this.userDbService.findOneByPhone(phonenumber);
  }
}
