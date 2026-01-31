import {
  PaginationLinks,
  PaginationMeta,
} from '../interfaces/pagination.interface';

export interface PaginationOptions<T> {
  items: T[];
  totalItems: number;
  currentPage: number;
  limit: number;
  route: string;
}

export const paginate = <T>({
  items,
  totalItems,
  currentPage,
  limit,
  route,
}: PaginationOptions<T>): {
  data: T[];
  meta: PaginationMeta;
  links: PaginationLinks;
} => {
  const totalPages = Math.ceil(totalItems / limit);

  const meta: PaginationMeta = {
    itemsPerPage: limit,
    totalItems,
    currentPage,
    totalPages,
  };
  const links: PaginationLinks =
    totalItems === 0
      ? { first: null, last: null, next: null, previous: null }
      : {
          first: `${route}?page=1&limit=${limit}`,
          last: `${route}?page=${totalPages}&limit=${limit}`,

          next:
            currentPage < totalPages
              ? `${route}?page=${currentPage + 1}&limit=${limit}`
              : undefined,
          previous:
            currentPage > 1
              ? `${route}?page=${currentPage - 1}&limit=${limit}`
              : undefined,
        };

  return { data: items, meta, links };
};
