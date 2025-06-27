// src/module/user-db/user-db.module.ts

import { Module } from '@nestjs/common';
import { UserDbService } from './user-db.service';
import { UserDbResolver } from './user-db.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { UserDB, UserDBSchema } from './user-db.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserDB.name, schema: UserDBSchema }]),
    UsersModule,
  ],
  providers: [UserDbService, UserDbResolver],
})
export class UserDbModule {}
