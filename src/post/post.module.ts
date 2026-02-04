import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './providers/post.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { UserModule } from 'src/user/user.module';
import { TagModule } from 'src/tag/tag.module';
import { CommunityModule } from 'src/community/community.module';
import { PostVote } from './entities/post-vote.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, PostVote]),
    UserModule,
    TagModule,
    CommunityModule,
  ],
  exports: [PostService],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
