import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CommunityOwnerResponseDto {
  @ApiProperty({ example: 2 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'john_doe' })
  @Expose()
  username: string;

  @ApiProperty({ example: 'John doe' })
  @Expose()
  fullName: string | null;

  @ApiProperty({ example: 'https://example.com/images/avatar.png' })
  @Expose()
  avatar: string | null;

  @ApiProperty({ example: 'john@example.com' })
  @Expose()
  email: string;
}
