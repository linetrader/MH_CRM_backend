// src/users/users.schema.ts

import { Field, ObjectType, ID } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
@ObjectType()
export class UserDB extends Document {
  @Field(() => ID)
  id!: string;

  @Prop({ type: String, required: false })
  @Field({ nullable: true })
  username?: string;

  @Prop({ required: true })
  @Field()
  phonenumber!: string;

  @Prop({ type: String, required: false })
  @Field({ nullable: true })
  sex?: string; // male, female

  @Prop({ type: String, required: false })
  @Field({ nullable: true })
  incomepath?: string; // youtube, titok, sns, els

  @Prop({ type: String, required: false })
  @Field({ nullable: true })
  creatorname?: string;

  @Prop({ type: String, required: false })
  @Field({ nullable: true })
  memo?: string;

  @Prop({ required: true })
  @Field()
  type!: string; // els, stock_new, stock_old, coin_new, coin_old, potential, customer_fund1, customer_fund2, customer_fund3, black_longterm, black_notIdentity, black_wrongnumber

  @Prop({ type: String, index: true })
  @Field({ nullable: true })
  manager!: string;

  @Prop({ type: String, required: false })
  @Field(() => String, { nullable: true })
  incomedate?: Date;

  @Field(() => String)
  createdAt!: Date;

  @Field(() => String)
  updatedAt!: Date;
}

export const UserDBSchema = SchemaFactory.createForClass(UserDB);
