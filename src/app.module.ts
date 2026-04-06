import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import type { ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import dbConfig from './configs/db.config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { FollowModule } from './follow/follow.module';
import { PostModule } from './post/post.module';
import { TagModule } from './tag/tag.module';
import { CommunityModule } from './community/community.module';
import { CommentModule } from './comment/comment.module';
import { SearchModule } from './search/search.module';
import { QuestionModule } from './question/question.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { RecommendationModule } from './recommendation/recommendation.module';
import { AnswerModule } from './answer/answer.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.dev',
      load: [dbConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [dbConfig.KEY],
      useFactory: (dbConfiguration: ConfigType<typeof dbConfig>) => ({
        type: 'postgres',
        host: dbConfiguration.host,
        port: dbConfiguration.port,
        username: dbConfiguration.user,
        password: dbConfiguration.password,
        database: dbConfiguration.name,
        synchronize: dbConfiguration.synchronize,
        autoLoadEntities: dbConfiguration.autoLoadEntities,
      }),
    }),
    UserModule,
    AuthModule,
    FollowModule,
    PostModule,
    TagModule,
    CommunityModule,
    CommentModule,
    SearchModule,
    QuestionModule,
    CloudinaryModule,
    RecommendationModule,
    AnswerModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule {}
