import {
  ArrayUnique,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  IsUrl,
  IsArray,
  ArrayNotEmpty,
  IsInt,
  IsPositive,
  Matches,
  MinLength,
} from 'class-validator';
import { CommunityVisibility } from '../enums/community-visibility.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateCommunityDto {
  @ApiProperty({
    description: 'Name of the community',
    maxLength: 100,
    example: 'Tech Geeks',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  @Matches(/\S/, { message: 'Community name cannot be empty' })
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the community',
    maxLength: 255,
    example: 'A place for technology enthusiasts to share ideas.',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsOptional()
  @MinLength(5)
  @MaxLength(255)
  @Matches(/\S/, { message: 'Description cannot be empty when provided' })
  description?: string;

  @ApiPropertyOptional({
    enum: CommunityVisibility,
    example: CommunityVisibility.PUBLIC,
  })
  @IsEnum(CommunityVisibility)
  @IsOptional()
  visibility?: CommunityVisibility;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.png',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/cover.png',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsUrl()
  coverImage?: string;

  @ApiProperty({
    description: 'IDs of tags associated with the community',
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
