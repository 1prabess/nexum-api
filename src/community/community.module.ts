import { forwardRef, Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Community } from './entities/community.entity';
import { CommunityMember } from './entities/community-member.entity';
import { CommunityInvite } from './entities/community-invite.entity';
import { UserModule } from 'src/user/user.module';
import { CommunityService } from './community.service';
import { TagModule } from 'src/tag/tag.module';
import { PostModule } from 'src/post/post.module';
import { QuestionModule } from 'src/question/question.module';
import { Post } from 'src/post/entities/post.entity';
import { Question } from 'src/question/entities/question.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Community,
      CommunityMember,
      CommunityInvite,
      Post,
      Question,
    ]),
    UserModule,
    TagModule,
    forwardRef(() => PostModule),
    forwardRef(() => QuestionModule),
  ],
  exports: [CommunityService],
  controllers: [CommunityController],
  providers: [CommunityService],
})
export class CommunityModule {}
