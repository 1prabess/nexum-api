import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Unique username for the user',
    example: 'john_doe',
  })
  username: string;

  @ApiProperty({
    description: 'Email address of the user',
    example: 'john@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Password for the user account',
    example: 'strongPassword123',
  })
  password: string;

  @ApiProperty({
    description: 'Optional avatar URL for the user profile',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  avatar?: string;
}
