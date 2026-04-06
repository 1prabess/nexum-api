import {
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsArray,
  ArrayNotEmpty,
  IsInt,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuestionUrgency } from '../enums/question-urgency.enum';

export class CreateQuestionDto {
  @ApiProperty({
    description: 'Title of the question',
    minLength: 5,
    maxLength: 200,
    example: 'How do I optimize TypeORM queries?',
  })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Content of the question (JSON from editor allowed)',
    minLength: 10,
    example: JSON.stringify([
      {
        id: 'q1',
        type: 'paragraph',
        props: {},
        content: [
          {
            type: 'text',
            text: 'How should I optimize TypeORM queries for a feed endpoint with votes and comments?',
            styles: {},
          },
        ],
      },
      {
        id: 'q2',
        type: 'paragraph',
        props: {},
        content: [
          {
            type: 'text',
            text: 'I currently use multiple joins and relation counts, but response time increases a lot on page 2+.',
            styles: {},
          },
        ],
      },
    ]),
  })
  @IsString()
  @MinLength(10)
  @Matches(/\S/, { message: 'Content cannot be empty' })
  content: string;

  @ApiProperty({
    description: 'IDs of tags associated with the question',
    type: [Number],
    example: [1, 2, 5],
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'At least one tag is required' })
  @IsInt({ each: true })
  tagIds: number[];

  @ApiPropertyOptional({
    description: 'Urgency level of the question',
    enum: QuestionUrgency,
    default: QuestionUrgency.MEDIUM,
  })
  @IsOptional()
  urgency?: QuestionUrgency;

  @ApiPropertyOptional({
    description: 'ID of the community where the question will be posted',
    example: 3,
  })
  @IsOptional()
  @IsInt()
  communityId?: number;
}
