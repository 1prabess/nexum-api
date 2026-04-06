import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  IsUrl,
  IsArray,
  ArrayNotEmpty,
  IsInt,
} from 'class-validator';
import { CommunityVisibility } from '../enums/community-visibility.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommunityDto {
  @ApiProperty({
    description: 'Name of the community',
    maxLength: 100,
    example: 'Tech Geeks',
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Description of the community',
    maxLength: 255,
    example: 'A place for technology enthusiasts to share ideas.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
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
  @IsString()
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/cover.png',
  })
  @IsString()
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
  tagIds: number[];
}
