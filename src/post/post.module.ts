import { forwardRef, Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { UserModule } from 'src/user/user.module';
import { TagModule } from 'src/tag/tag.module';
import { CommunityModule } from 'src/community/community.module';
import { PostVote } from './entities/post-vote.entity';
import { SearchModule } from 'src/search/search.module';
import { Tag } from 'src/tag/tag.entity';
import { NotificationModule } from 'src/notification/notification.module';
import { FollowModule } from 'src/follow/follow.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, PostVote, Tag]),
    UserModule,
    TagModule,
    forwardRef(() => CommunityModule),
    SearchModule,
    NotificationModule,
    FollowModule,
  ],
  exports: [PostService],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
