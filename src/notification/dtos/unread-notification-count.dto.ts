import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UnreadNotificationCountDto {
  @ApiProperty({ example: 3 })
  @Expose()
  count: number;
}
