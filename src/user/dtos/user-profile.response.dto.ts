import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { CommunityVisibility } from 'src/community/enums/community-visibility.enum';

class ProfileCommunitySummaryDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Tech Geeks' })
  @Expose()
  name: string;

  @ApiPropertyOptional({ example: 'https://example.com/community-avatar.png' })
  @Expose()
  avatar?: string;

  @ApiProperty({ enum: CommunityVisibility, example: CommunityVisibility.PUBLIC })
  @Expose()
  visibility: CommunityVisibility;
}

export class UserProfileResponseDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ description: 'Username', example: 'john_doe' })
  @Expose()
  username: string;

  @ApiPropertyOptional({ description: 'Full name', example: 'John Doe' })
  @Expose()
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Bio',
    example: 'Full-stack developer and tech enthusiast',
  })
  @Expose()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Cover photo URL',
    example: 'https://example.com/cover.jpg',
  })
  @Expose()
  coverPhoto?: string;

  @ApiPropertyOptional({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.png',
  })
  @Expose()
  avatar?: string;

  @ApiProperty({
    description: 'User email',
    example: 'john@example.com',
  })
  @Expose()
  email: string;

  @ApiProperty({ description: 'Followers count', example: 120 })
  @Expose()
  followersCount: number;

  @ApiProperty({ description: 'Following count', example: 75 })
  @Expose()
  followingCount: number;

  @ApiProperty({
    description: 'Is current user following this user',
    example: false,
  })
  @Expose()
  isFollowing?: boolean;

  @ApiProperty({
    type: () => ProfileCommunitySummaryDto,
    isArray: true,
  })
  @Expose()
  @Type(() => ProfileCommunitySummaryDto)
  communitiesCreated: ProfileCommunitySummaryDto[];

  @ApiProperty({
    type: () => ProfileCommunitySummaryDto,
    isArray: true,
  })
  @Expose()
  @Type(() => ProfileCommunitySummaryDto)
  communitiesJoined: ProfileCommunitySummaryDto[];

  @ApiProperty({
    description: 'Account creation date',
    example: '2026-02-23T10:00:00Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2026-02-25T14:30:00Z',
  })
  @Expose()
  updatedAt: Date;
}
