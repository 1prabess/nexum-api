import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateAnswerDto {
  @ApiProperty({ example: 'Here is my answer to the question' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  content: string;

  @ApiProperty({ example: 12, description: 'ID of the question' })
  @IsInt()
  @IsPositive()
  questionId: number;
}
