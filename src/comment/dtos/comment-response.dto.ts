import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AuthorSummaryDto } from 'src/common/dtos/author-summary.dto';
import { VoteType } from 'src/common/enums/vote-type.enum';

export class CommentResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'This is a comment' })
  @Expose()
  content: string;

  @ApiProperty({ example: '2026-03-02T12:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ type: () => AuthorSummaryDto })
  @Expose()
  @Type(() => AuthorSummaryDto)
  author: AuthorSummaryDto;

  @ApiProperty({ example: 0 })
  @Expose()
  upvotes: number;

  @ApiProperty({ example: 0 })
  @Expose()
  downvotes: number;

  @ApiProperty({
    enum: ['UP', 'DOWN', null],
    example: 'UP',
    required: false,
  })
  @Expose()
  userVote?: VoteType | null;

  @ApiProperty({
    type: () => CommentResponseDto,
    isArray: true,
  })
  @Expose()
  @Type(() => CommentResponseDto)
  replies: CommentResponseDto[] = [];
}
