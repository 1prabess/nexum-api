import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  MaxLength,
  IsUrl,
  Matches,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { USERNAME_REGEX } from 'src/common/constants/validation.constants';

export class UpdateProfileDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(USERNAME_REGEX, {
    message:
      'Username must be 3-30 characters and contain only letters, numbers, or underscores',
  })
  @ApiPropertyOptional({
    description: 'Username of the user',
    maxLength: 30,
    example: 'john_doe',
  })
  username?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiPropertyOptional({
    description: 'Full name of the user',
    maxLength: 100,
    example: 'John Doe',
  })
  fullName?: string;

  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({
    description: 'Short bio about the user',
    maxLength: 255,
    example: 'I love coding and sharing knowledge',
  })
  bio?: string | null;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional({
    description: 'URL to the avatar image of the user',
    example: 'https://example.com/avatar.png',
  })
  avatar?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional({
    description: 'URL to the cover photo of the user',
    example: 'https://example.com/cover.png',
  })
  coverPhoto?: string;
}
