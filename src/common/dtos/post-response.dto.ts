import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthorSummaryDto } from './author-summary.dto';
import { CommunitySummaryDto } from 'src/community/dtos/community-summary.dto';
import { TagDto } from 'src/tag/dtos/tag.dto';
import { VoteType } from '../enums/vote-type.enum';

export class PostResponseDto {
  @ApiProperty({
    description: 'Unique ID of the post',
    example: 101,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Title of the post',
    example: 'How to optimize TypeORM queries?',
  })
  @Expose()
  title: string;

  @ApiProperty({
    description: 'Content of the post (JSON from BlockNote editor)',
    example:
      '{"type":"paragraph","children":[{"text":"This is a post content"}]}',
  })
  @Expose()
  content: string;

  @ApiProperty({
    description: 'Date when the post was created',
    example: '2026-02-23T10:00:00Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Number of upvotes',
    example: 12,
  })
  @Expose()
  upvotes: number;

  @ApiProperty({
    description: 'Number of downvotes',
    example: 1,
  })
  @Expose()
  downvotes: number;

  @ApiProperty({
    description: "Current user's vote on this post",
    enum: ['UP', 'DOWN', null],
    example: 'UP',
  })
  @Expose()
  userVote: VoteType | null;

  @ApiProperty({
    description: 'Author summary information',
    type: () => AuthorSummaryDto,
    example: {
      id: 2,
      username: 'john_doe',
      avatar: 'https://example.com/avatar.png',
    },
  })
  @Expose()
  @Type(() => AuthorSummaryDto)
  author: AuthorSummaryDto;

  @ApiProperty({ type: [TagDto] })
  @Expose()
  @Type(() => TagDto)
  tags: TagDto[];

  @ApiProperty({ description: 'Post last update timestamp' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({
    description: 'Total number of comments',
    example: 5,
  })
  @Expose()
  commentCount: number;

  @ApiPropertyOptional({
    type: CommunitySummaryDto,
    description: 'Community info if post belongs to one',
  })
  @Expose()
  @Type(() => CommunitySummaryDto)
  community?: CommunitySummaryDto | null;
}
