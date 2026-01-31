import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ description: 'Unique ID of the user', example: 1 })
  id: number;

  @ApiProperty({ description: 'Username of the user', example: 'john_doe' })
  username: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    required: false,
  })
  fullName?: string;

  @ApiProperty({
    description: 'Short bio about the user',
    example: 'I love coding',
    required: false,
  })
  bio?: string;

  @ApiProperty({
    description: 'URL of the avatar image',
    example: 'https://example.com/avatar.png',
    required: false,
  })
  avatar?: string;

  @ApiProperty({
    description: 'URL of the cover photo',
    example: 'https://example.com/cover.png',
    required: false,
  })
  coverPhoto?: string;

  @ApiProperty({ description: 'Number of followers', example: 42 })
  followersCount: number;

  @ApiProperty({
    description: 'Number of users this user is following',
    example: 10,
  })
  followingCount: number;

  @ApiProperty({
    description: 'Account creation date',
    example: '2026-01-31T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2026-01-31T12:30:00.000Z',
  })
  updatedAt: Date;
}
