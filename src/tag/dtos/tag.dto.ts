import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class TagDto {
  @ApiProperty({
    description: 'Tag ID',
    example: 1,
  })
  @Expose()
  id: number;

  @ApiProperty({
    description: 'Tag name',
    example: 'nestjs',
  })
  @Expose()
  name: string;
}
