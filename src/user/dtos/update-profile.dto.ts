import { IsOptional, IsString, MaxLength, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ApiPropertyOptional({
    description: 'Username of the user',
    maxLength: 50,
    example: 'john_doe',
  })
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiPropertyOptional({
    description: 'Full name of the user',
    maxLength: 100,
    example: 'John Doe',
  })
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({
    description: 'Short bio about the user',
    maxLength: 255,
    example: 'I love coding and sharing knowledge',
  })
  bio?: string;

  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional({
    description: 'URL to the avatar image of the user',
    example: 'https://example.com/avatar.png',
  })
  avatar?: string;

  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional({
    description: 'URL to the cover photo of the user',
    example: 'https://example.com/cover.png',
  })
  coverPhoto?: string;
}
