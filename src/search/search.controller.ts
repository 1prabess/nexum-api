import {
  Controller,
  DefaultValuePipe,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { ICurrentUser } from 'src/common/interfaces/current-user.interface';
import { JwtAccessTokenAuthGuard } from 'src/auth/guards/jwt-access-auth.guard';
import { ApiSuccessResponse } from 'src/common/decorators/api-success-response.decorator';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { SearchPostResponseDto } from './dtos/search-post-response.dto';

@ApiTags('Search')
@UseGuards(JwtAccessTokenAuthGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  // ------------------ SEARCH CONTENT ------------------
  @Get()
  @ApiOperation({ summary: 'Search posts using TF-IDF algorithm' })
  @ApiQuery({ name: 'q', description: 'Search query', required: true })
  @ApiQuery({
    name: 'top',
    description: 'Number of top results',
    required: false,
  })
  @ApiSuccessResponse(SearchPostResponseDto, {
    isArray: true,
    message: 'Search results fetched successfully',
  })
  @ResponseMessage('Search results fetched successfully')
  async search(
    @Query('q') query: string,
    @Query(
      'top',
      new ParseIntPipe({ optional: true }),
      new DefaultValuePipe(20),
    )
    topN: number,
    @CurrentUser() user?: ICurrentUser,
  ) {
    return this.searchService.search(query, Math.min(Math.max(topN, 1), 100), user?.id);
  }
}
