import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import type {
  PaginationLinks,
  PaginationMeta,
} from '../interfaces/pagination.interface';

export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: 'Array of items for the current page',
    isArray: true,
    type: Object,
    example: [
      {
        id: 11,
        title: 'My First Blog Post',
        content: 'This is the content of my post. It cannot be empty.',
        createdAt: '2026-02-22T04:07:49.431Z',
        upvotes: 1,
        downvotes: 0,
        userVote: 'UP',
        author: {
          id: 2,
          username: 'john_doe',
          avatar: null,
        },
        tags: [
          { id: 1, name: 'react' },
          { id: 2, name: 'javascript' },
        ],
      },
    ],
  })
  @Type(() => Object)
  data: T[];

  @ApiProperty({
    description:
      'Pagination metadata such as total items, current page, and total pages',
    example: {
      itemsPerPage: 10,
      totalItems: 1,
      currentPage: 1,
      totalPages: 1,
    },
  })
  meta: PaginationMeta;

  @ApiProperty({
    description: 'Pagination links for first, last, next, and previous pages',
    example: {
      first: 'http://localhost:3000/communities/1/feed?page=1&limit=10',
      last: 'http://localhost:3000/communities/1/feed?page=1&limit=10',
      next: null,
      previous: null,
    },
  })
  links: PaginationLinks;
}
