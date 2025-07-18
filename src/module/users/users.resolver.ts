// src/users/users.resolver.ts

import { Resolver, Mutation, Args, Query, Context, Int } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './users.schema';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { GetUsersResponse } from './dto/login-response.dto';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User)
  async getUserInfo(@Context() context: any): Promise<User> {
    const user = context.req.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('User is not authenticated');
    }

    const userInfo = await this.usersService.getUserInfo(user);
    if (!userInfo) {
      throw new BadRequestException('User not found');
    }

    return userInfo;
  }

  @Query(() => GetUsersResponse, { description: 'Get users under my network' })
  async getUsersUnderMyNetwork(
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Context() context: any,
  ): Promise<GetUsersResponse> {
    const user = context.req.user;
    if (!user || !user.id) {
      throw new UnauthorizedException('User is not authenticated');
    }

    const offset = (page - 1) * limit;
    const { users, totalUsers } =
      await this.usersService.getUsersUnderMyNetwork(user.id, limit, offset);

    return new GetUsersResponse(users, totalUsers);
  }

  @Query(() => [String], { description: 'Get usernames under my network' }) // ✅ 수정
  async getUsernamesUnderMyNetwork(@Context() context: any): Promise<string[]> {
    const user = context.req.user;
    if (!user?.id) throw new UnauthorizedException('User is not authenticated');

    return await this.usersService.getUsernamesUnderMyNetwork(user.id);
  }

  @Mutation(() => String)
  async register(
    @Args('email') email: string,
    @Args('username') username: string,
    @Args('firstname') firstname: string,
    @Args('lastname') lastname: string,
    @Args('password') password: string,
    @Args('referrer', { nullable: true }) referrer?: string,
  ): Promise<string> {
    return await this.usersService.register({
      email,
      username,
      firstname,
      lastname,
      password,
      referrer,
    });
  }

  @Mutation(() => String, { description: 'Delete user by ID' })
  async deleteUser(
    @Context() context: any,
    @Args('userId') userId: string,
  ): Promise<string> {
    const user = context.req.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('User is not authenticated');
    }

    const isAdmin = await this.usersService.isValidAdmin(user.id);
    if (!isAdmin) {
      throw new UnauthorizedException('Unauthorized: Admin access only');
    }

    return await this.usersService.deleteUserById(userId);
  }

  @Mutation(() => String)
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<string> {
    const token = await this.usersService.login(email, password);
    if (token) {
      return token;
    }

    throw new UnauthorizedException('UsersResolver - Token Not Found');
  }

  @Mutation(() => String, { description: 'Update user details' })
  async updateUser(
    @Context() context: any,
    @Args('userId') userId: string,
    @Args('username', { nullable: true }) username?: string,
    @Args('firstname', { nullable: true }) firstname?: string,
    @Args('lastname', { nullable: true }) lastname?: string,
    @Args('email', { nullable: true }) email?: string,
    @Args('status', { nullable: true }) status?: string,
    @Args('referrer', { nullable: true }) referrer?: string,
    @Args('userLevel', { nullable: true, type: () => Int }) userLevel?: number,
  ): Promise<string> {
    const user = context.req.user;

    if (!user || !user.id) {
      throw new UnauthorizedException('User is not authenticated');
    }

    const isAdmin = await this.usersService.isValidAdmin(user.id);
    if (!isAdmin) {
      throw new UnauthorizedException('Unauthorized: Admin access only');
    }

    return this.usersService.updateUserDetails(userId, {
      username,
      firstname,
      lastname,
      email,
      status,
      referrer,
      userLevel,
    });
  }

  @Mutation(() => String, { description: 'Change user password' })
  async changePassword(
    @Context() context: any,
    @Args('newPassword') newPassword: string,
  ): Promise<string> {
    // 1️⃣ 인증된 사용자 가져오기
    const user = context.req.user;
    if (!user || !user.id) {
      throw new UnauthorizedException('User is not authenticated');
    }

    // 2️⃣ 서비스 메서드 호출하여 비밀번호 변경
    return this.usersService.changePassword(user.id, newPassword);
  }
}
