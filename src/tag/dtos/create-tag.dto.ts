import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({
    description: 'Name of the tag',
    example: 'react',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}
