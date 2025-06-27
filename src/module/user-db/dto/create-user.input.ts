// src/module/user-db/dto/create-user.input.ts

import { InputType, Field, ObjectType, Int } from '@nestjs/graphql';
import { UserDB } from '../user-db.schema';

@InputType()
export class CreateUserInput {
  @Field({ nullable: true })
  username?: string;

  @Field()
  phonenumber!: string;

  @Field({ nullable: true })
  sex?: string;

  @Field({ nullable: true })
  incomepath?: string;

  @Field({ nullable: true })
  creatorname?: string; // ✅ 추가

  @Field({ nullable: true })
  memo?: string;

  @Field()
  type!: string;

  @Field({ nullable: true })
  manager?: string;

  @Field({ nullable: true })
  incomedate?: string;
}

@ObjectType()
export class UserDBPagination {
  @Field(() => [UserDB])
  users!: UserDB[];

  @Field(() => Int)
  totalUsers!: number;
}
