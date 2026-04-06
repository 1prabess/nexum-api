import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({
    description: 'The secure URL of the uploaded image on Cloudinary',
    example:
      'https://res.cloudinary.com/your_cloud_name/image/upload/v1687421/sample.jpg',
  })
  @IsString()
  url: string;
}
