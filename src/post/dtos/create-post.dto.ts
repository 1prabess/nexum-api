import {
  ArrayUnique,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsArray,
  IsInt,
  ArrayNotEmpty,
  IsPositive,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreatePostDto {
  @ApiProperty({
    description: 'Title of the post',
    minLength: 5,
    maxLength: 200,
    example: 'My First Blog Post',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  @Matches(/\S/, { message: 'Title cannot be empty' })
  title: string;

  @ApiProperty({
    description: 'Content of the post (Block JSON format)',
    minLength: 10,
    example: JSON.stringify([
      {
        id: 'intro',
        type: 'paragraph',
        props: {},
        content: [
          {
            type: 'text',
            text: 'I migrated our NestJS API to module-first architecture and need feedback on folder structure.',
            styles: {},
          },
        ],
      },
      {
        id: 'details',
        type: 'paragraph',
        props: {},
        content: [
          {
            type: 'text',
            text: 'Current setup uses controllers, services, DTOs, and entity-level validation. Any improvements?',
            styles: {},
          },
        ],
      },
    ]),
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(10)
  @Matches(/\S/, { message: 'Content cannot be empty' })
  content: string;

  @ApiProperty({
    description: 'IDs of tags associated with the post',
    example: [1, 3, 5],
    type: [Number],
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'At least one tag is required' })
  @IsInt({ each: true })
  @IsPositive({ each: true })
  @ArrayUnique({ message: 'Duplicate tags are not allowed' })
  tagIds: number[];
}
