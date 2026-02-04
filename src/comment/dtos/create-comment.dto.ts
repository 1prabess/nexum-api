import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    description: 'ID of the post to comment on',
    example: 12,
  })
  @IsInt()
  @IsPositive()
  postId: number;

  @ApiProperty({
    description: 'Content of the comment',
    example: 'This post explains it really well!',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  content: string;

  @ApiPropertyOptional({
    description: 'Parent comment ID (required only when replying)',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  parentId?: number;
}
