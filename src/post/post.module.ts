import { Module } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostService } from './providers/post.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './post.entity';
import { UserModule } from 'src/user/user.module';
import { TagModule } from 'src/tag/tag.module';

@Module({
  imports: [TypeOrmModule.forFeature([Post]), UserModule, TagModule],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
