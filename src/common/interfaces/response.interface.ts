import { PaginationLinks, PaginationMeta } from './pagination.interface';

export interface Response<T = unknown> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  meta?: PaginationMeta;
  links?: PaginationLinks;
}
