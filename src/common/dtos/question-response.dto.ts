import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { CommunitySummaryDto } from 'src/community/dtos/community-summary.dto';
import { QuestionUrgency } from 'src/question/enums/question-urgency.enum';
import { TagDto } from 'src/tag/dtos/tag.dto';
import { AuthorSummaryDto } from './author-summary.dto';
import { VoteType } from '../enums/vote-type.enum';

export class QuestionResponseDto {
  @ApiProperty({ description: 'Question ID' })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Question title' })
  @Expose()
  title: string;

  @ApiProperty({ description: 'Rich content of the question' })
  @Expose()
  content: string;

  @ApiProperty({
    description: "Current user's vote on this question",
    enum: ['UP', 'DOWN', null],
    example: 'UP',
  })
  @Expose()
  userVote: VoteType | null;

  @ApiProperty({ type: AuthorSummaryDto })
  @Expose()
  @Type(() => AuthorSummaryDto)
  author: AuthorSummaryDto;

  @ApiProperty({ type: [TagDto] })
  @Expose()
  @Type(() => TagDto)
  tags: TagDto[];

  @ApiProperty({
    description: 'Urgency level of the question',
    enum: QuestionUrgency,
  })
  @Expose()
  urgency: QuestionUrgency;

  @ApiProperty({ description: 'Number of upvotes', example: 0 })
  @Expose()
  upvotes: number;

  @ApiProperty({ description: 'Number of downvotes', example: 0 })
  @Expose()
  downvotes: number;

  @ApiProperty({ description: 'Number of answers', example: 0 })
  @Expose()
  answerCount: number;

  @ApiProperty({ description: 'Question creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Question last update timestamp' })
  @Expose()
  updatedAt: Date;

  @ApiPropertyOptional({
    type: CommunitySummaryDto,
    description: 'Community info if question belongs to one',
  })
  @Expose()
  @Type(() => CommunitySummaryDto)
  community?: CommunitySummaryDto | null;
}
