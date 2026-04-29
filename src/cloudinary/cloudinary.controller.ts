import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { memoryStorage } from 'multer';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { ApiSuccessResponse } from 'src/common/decorators/api-success-response.decorator';
import { UploadResponseDto } from './dtos/upload-response.dto';

const parsedUploadLimitMb = Number(process.env.UPLOAD_IMAGE_MAX_SIZE_MB ?? 50);
const uploadLimitMb = Number.isFinite(parsedUploadLimitMb)
  ? Math.max(parsedUploadLimitMb, 1)
  : 50;
const uploadLimitBytes = uploadLimitMb * 1024 * 1024;

@ApiTags('Cloudinary')
@Controller('cloudinary/upload')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  // ------------------ UPLOAD IMAGE ------------------
  @Post('image')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @ApiSuccessResponse(UploadResponseDto, {
    message: 'Image upload successful',
  })
  @ResponseMessage('Image upload successful')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: uploadLimitBytes },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResponseDto> {
    if (!file) return { url: '' };

    const result = await this.cloudinaryService.uploadImage(file, {
      folder: 'nestjs_uploads',
      resource_type: 'image',
    });

    return {
      url: result.secure_url,
    };
  }
}
