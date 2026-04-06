import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class VoteResultDto {
  @ApiProperty({ example: 12, description: 'Updated upvote count' })
  @Expose()
  upvotes: number;

  @ApiProperty({ example: 3, description: 'Updated downvote count' })
  @Expose()
  downvotes: number;
}
