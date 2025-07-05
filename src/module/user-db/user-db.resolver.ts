// src/module/user-db/user-db.resolver.ts

import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql';
import { UserDbService } from './user-db.service';
import { UserDB } from './user-db.schema';
import { CreateUserInput, UserDBPagination } from './dto/create-user.input';
import { UnauthorizedException } from '@nestjs/common';

@Resolver(() => UserDB)
export class UserDbResolver {
  constructor(private readonly userDbService: UserDbService) {}

  @Mutation(() => UserDB, { nullable: true }) // nullable: true 필수
  async createUserDB(
    @Context() context: any,
    @Args('createUserInput') createUserInput: CreateUserInput,
  ): Promise<UserDB | null> {
    const user = context.req.user;
    if (!user || !user.id) {
      throw new UnauthorizedException('User is not authenticated');
    }

    return this.userDbService.create(user.id, createUserInput);
  }

  @Mutation(() => Boolean)
  async deleteUserDB(
    @Context() context: any,
    @Args('id') id: string,
  ): Promise<boolean> {
    const user = context.req.user;
    if (!user || !user.id) {
      throw new UnauthorizedException('User is not authenticated');
    }

    return this.userDbService.deleteUserById(id);
  }

  @Mutation(() => UserDB)
  async updateUserDB(
    @Context() context: any,
    @Args('id') id: string,
    @Args('username', { nullable: true }) username?: string,
    @Args('phonenumber', { nullable: true }) phonenumber?: string,
    @Args('sex', { nullable: true }) sex?: string,
    @Args('incomepath', { nullable: true }) incomepath?: string,
    @Args('memo', { nullable: true }) memo?: string,
    @Args('type', { nullable: true }) type?: string,
    @Args('manager', { nullable: true }) manager?: string,
  ): Promise<UserDB> {
    const user = context.req.user;
    if (!user || !user.id) {
      throw new UnauthorizedException('User is not authenticated');
    }

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
    @Context() context: any,
    @Args('limit', { type: () => Int, nullable: true }) limit = 30,
    @Args('offset', { type: () => Int, nullable: true }) offset = 0,
  ): Promise<UserDBPagination> {
    const user = context.req.user;
    if (!user || !user.id) {
      throw new UnauthorizedException('User is not authenticated');
    }

    return this.userDbService.findAll(limit, offset);
  }

  @Query(() => UserDB, { name: 'findUserByPhone' })
  async findOneByPhone(
    @Context() context: any,
    @Args('phonenumber') phonenumber: string,
  ): Promise<UserDB | null> {
    const user = context.req.user;
    if (!user || !user.id) {
      throw new UnauthorizedException('User is not authenticated');
    }

    return this.userDbService.findOneByPhone(phonenumber);
  }

  @Query(() => UserDBPagination)
  async getUserDBsForMainUser(
    @Context() context: any,
    @Args('limit', { type: () => Int, nullable: true }) limit = 30,
    @Args('offset', { type: () => Int, nullable: true }) offset = 0,
    @Args('includeSelf', { type: () => Boolean, nullable: true })
    includeSelf = true,
    @Args('type', { type: () => String, nullable: true }) type?: string,
  ): Promise<UserDBPagination> {
    const user = context.req.user;
    if (!user || !user.id) {
      throw new UnauthorizedException('User is not authenticated');
    }

    return this.userDbService.findAll(limit, offset, includeSelf, type);
  }

  @Query(() => UserDBPagination)
  async getUserDBsByMyUsername(
    @Context() context: any,
    @Args('limit', { type: () => Int, nullable: true }) limit = 30,
    @Args('offset', { type: () => Int, nullable: true }) offset = 0,
    @Args('includeSelf', { type: () => Boolean, nullable: true })
    includeSelf = true,
    @Args('type', { type: () => String, nullable: true }) type?: string,
  ): Promise<UserDBPagination> {
    const user = context.req.user;
    if (!user || !user.id) {
      throw new UnauthorizedException('User is not authenticated');
    }

    return this.userDbService.findUserDBsByMyUsername(
      user.id,
      limit,
      offset,
      includeSelf,
      type,
    );
  }

  @Query(() => UserDBPagination)
  async getUserDBsUnderMyNetwork(
    @Context() context: any,
    @Args('limit', { type: () => Int, nullable: true }) limit = 30,
    @Args('offset', { type: () => Int, nullable: true }) offset = 0,
    @Args('includeSelf', { type: () => Boolean, nullable: true })
    includeSelf = true,
    @Args('type', { type: () => String, nullable: true }) type?: string,
  ): Promise<UserDBPagination> {
    // 1️⃣ 인증된 사용자 가져오기
    const user = context.req.user;
    if (!user || !user.id) {
      throw new UnauthorizedException('User is not authenticated');
    }

    return this.userDbService.findUserDBsUnderMyNetwork(
      user.id,
      limit,
      offset,
      includeSelf, // ✅ 올바른 위치에 boolean 값 전달
      type,
    );
  }

  @Query(() => UserDBPagination) // 응답 타입은 아래 참고
  async searchUserDBsUnderMyNetworkWithOr(
    @Context() context: any,
    @Args('limit', { type: () => Int, nullable: true }) limit = 30,
    @Args('offset', { type: () => Int, nullable: true }) offset = 0,
    @Args('username', { type: () => String, nullable: true }) username?: string,
    @Args('phonenumber', { type: () => String, nullable: true })
    phonenumber?: string,
    @Args('incomepath', { type: () => String, nullable: true })
    incomepath?: string,
    @Args('creatorname', { type: () => String, nullable: true })
    creatorname?: string,
    @Args('manager', { type: () => String, nullable: true }) manager?: string,
    @Args('type', { type: () => String, nullable: true }) type?: string,
  ): Promise<UserDBPagination> {
    // 1️⃣ 인증된 사용자 가져오기
    const user = context.req.user;
    if (!user || !user.id) {
      throw new UnauthorizedException('User is not authenticated');
    }

    return this.userDbService.searchUserDBsUnderMyNetworkWithOr(
      user.id,
      limit,
      offset,
      { username, phonenumber, incomepath, creatorname, manager, type },
    );
  }
}
