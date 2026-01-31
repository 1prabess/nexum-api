import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
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
}
