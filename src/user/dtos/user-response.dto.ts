import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Username' })
  @Expose()
  username: string;

  @ApiPropertyOptional({ description: 'Full name' })
  @Expose()
  fullName?: string;

  @ApiPropertyOptional({ description: 'User biography' })
  @Expose()
  bio?: string;

  @ApiPropertyOptional({ description: 'Cover photo URL' })
  @Expose()
  coverPhoto?: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  @Expose()
  avatar?: string;

  @ApiProperty({ description: 'Email address' })
  @Expose()
  email: string;

  @ApiProperty({ description: 'Followers count' })
  @Expose()
  followersCount: number;

  @ApiProperty({ description: 'Following count' })
  @Expose()
  followingCount: number;

  @ApiProperty({ description: 'Account creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  updatedAt: Date;
}
