import { ApiProperty } from '@nestjs/swagger';

class SearchAuthorDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'john_doe' })
  username: string;
}

class SearchTagDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'react' })
  name: string;
}

export class SearchPostResponseDto {
  @ApiProperty({ example: 11 })
  id: number;

  @ApiProperty({ example: 'How to optimize TypeORM queries?' })
  title: string;

  @ApiProperty({ type: () => SearchAuthorDto })
  author: SearchAuthorDto;

  @ApiProperty({ type: () => SearchTagDto, isArray: true })
  tags: SearchTagDto[];

  @ApiProperty({ example: '2026-03-01T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: 0.83, description: 'TF-IDF relevance score' })
  score: number;
}
