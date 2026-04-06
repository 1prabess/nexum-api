import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AuthorSummaryDto {
  @ApiProperty({
    description: 'Unique ID of the author',
    example: 2,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Username of the author',
    example: 'john_doe',
  })
  @Expose()
  username: string;

  @ApiProperty({
    description: 'Fullname of the author',
    example: 'John Doe',
  })
  @Expose()
  fullName: string;

  @ApiProperty({
    description: 'Avatar URL of the author (nullable)',
    example: 'https://example.com/avatar.png',
    nullable: true,
  })
  @Expose()
  avatar: string | null;
}
