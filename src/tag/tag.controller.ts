import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { TagService } from './tag.service';
import { CreateTagDto } from './dtos/create-tag.dto';
import { JwtAccessTokenAuthGuard } from 'src/auth/guards/jwt-access-auth.guard';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { ApiOperation } from '@nestjs/swagger';
import { ApiSuccessResponse } from 'src/common/decorators/api-success-response.decorator';
import { TagDto } from './dtos/tag.dto';

@Controller('tags')
@UseGuards(JwtAccessTokenAuthGuard)
export class TagController {
  constructor(private readonly tagService: TagService) {}

  // ------------------ Get all tags ------------------
  @ApiOperation({ summary: 'Get all tags' })
  @ApiSuccessResponse(TagDto, {
    isArray: true,
    message: 'Tags fetched successfully',
  })
  @Get()
  @ResponseMessage('Tags fetched successfully')
  findAll() {
    return this.tagService.findAll();
  }

  // ------------------ Create a new tag ------------------
  @Post()
  @ApiOperation({ summary: 'Create a new tag' })
  @ApiSuccessResponse(TagDto, {
    message: 'Tag creation successful',
  })
  @ResponseMessage('Tag creation successful')
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagService.create(createTagDto);
  }
}
