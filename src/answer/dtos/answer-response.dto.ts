import { Expose, Type } from 'class-transformer';
import { AuthorSummaryDto } from 'src/common/dtos/author-summary.dto';

export class AnswerResponseDto {
  @Expose()
  id: number;

  @Expose()
  content: string;

  @Expose()
  upvotes: number;

  @Expose()
  downvotes: number;

  @Expose()
  isAccepted: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  @Type(() => AuthorSummaryDto)
  author: AuthorSummaryDto;

  @Expose()
  userVote?: 'UP' | 'DOWN' | null;
}
