// src/app.module.ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from './module/users/users.module';
import { AuthMiddleware } from './middleware/auth.middleware';
import { join } from 'path';
import { UserDbModule } from './module/user-db/user-db.module';

@Module({
  imports: [
    // 환경 변수 설정
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // MongoDB 연결 설정
    MongooseModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        authSource: 'admin', // 관리자 인증이 필요함을 명시
      }),
      inject: [ConfigService],
    }),

    // GraphQL 설정
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'), // 스키마 파일 자동 생성
      context: ({ req }: { req: Request }) => ({ req }), // req 타입 지정
      playground: process.env.NODE_ENV !== 'production', // 프로덕션 환경 제외 활성화
      introspection: true, // introspection 활성화
    }),

    // JWT 설정
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),

    // 사용자 모듈 및 지갑 모듈
    UsersModule,
    UserDbModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 모든 요청에 AuthMiddleware 적용
    consumer.apply(AuthMiddleware).forRoutes('*');
  }
}
