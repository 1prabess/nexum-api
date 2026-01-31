export interface PaginationMeta {
  itemsPerPage: number;
  totalItems: number;
  currentPage: number;
  totalPages: number;
}

export interface PaginationLinks {
  first: string | null;
  last: string | null;
  next?: string | null;
  previous?: string | null;
}
