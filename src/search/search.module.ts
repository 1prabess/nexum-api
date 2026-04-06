import { Module, forwardRef } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { PostModule } from 'src/post/post.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from 'src/post/entities/post.entity';
import { Question } from 'src/question/entities/question.entity';
import { Community } from 'src/community/entities/community.entity';
import { User } from 'src/user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Question, Community, User]),
    forwardRef(() => PostModule),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
