import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { TagService } from './providers/tag.service';
import { CreateTagDto } from './dtos/create-tag.dto';
import { JwtAccessTokenAuthGuard } from 'src/auth/guards/jwt-access-auth.guard';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { ApiOperation } from '@nestjs/swagger';

@Controller('tag')
@UseGuards(JwtAccessTokenAuthGuard)
export class TagController {
  constructor(private readonly tagService: TagService) {}

  // =====================================================
  // Get all tags
  // =====================================================
  @ApiOperation({ summary: 'Get all tags' })
  @Get()
  @ResponseMessage('Tags fetched successfully')
  findAll() {
    return this.tagService.findAll();
  }

  // =====================================================
  // Create a new tag
  // =====================================================
  @Post()
  @ApiOperation({ summary: 'Create a new tag' })
  @ResponseMessage('Tag creation successful')
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagService.create(createTagDto);
  }
}
