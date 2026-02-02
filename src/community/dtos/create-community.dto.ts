import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  IsUrl,
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
    description: 'Visibility of the community (public or private)',
    enum: CommunityVisibility,
    example: CommunityVisibility.PUBLIC,
  })
  @IsEnum(CommunityVisibility)
  @IsOptional()
  visibility?: CommunityVisibility;

  @ApiPropertyOptional({
    description: 'URL of the community avatar image',
    example: 'https://example.com/images/avatar.png',
  })
  @IsString()
  @IsOptional()
  @IsUrl()
  avatar?: string;

  @ApiPropertyOptional({
    description: 'URL of the community cover image',
    example: 'https://example.com/images/cover.png',
  })
  @IsString()
  @IsOptional()
  @IsUrl()
  coverImage?: string;
}
