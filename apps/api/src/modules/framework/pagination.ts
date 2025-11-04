import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';

export type Pagination = { path: string; page: number; limit: number };

const DEFAULT_PAGINATION_LIMIT = 20;
const DEFAULT_PAGINATION_LIMIT_MAX = 200;
export const QueryPagination = createParamDecorator(
  (
    options: {
      /** When there is no `?limit` we use this value. @default {@link DEFAULT_PAGINATION_LIMIT} */
      defaultLimit?: number;
      /** Throws when `?limit` > maxLimit. @default {@link DEFAULT_PAGINATION_LIMIT_MAX} */
      maxLimit?: number;
    } = {},
    ctx: ExecutionContext,
  ) => {
    const req = ctx.switchToHttp().getRequest<ExpressRequest>();

    const [queryPage] = ([] as unknown[]).concat(req.query.page);
    const pageNumber = Number(queryPage) || 1;
    if (
      !Number.isInteger(pageNumber) ||
      !Number.isFinite(pageNumber) ||
      pageNumber < 1
    )
      throw new BadRequestException(`invalid ?page URL parameter`);

    const limitMax = options.maxLimit ?? DEFAULT_PAGINATION_LIMIT_MAX;
    const defaultLimit = options.defaultLimit ?? DEFAULT_PAGINATION_LIMIT;
    const [queryLimit] = ([] as unknown[]).concat(req.query.limit);
    const limitNumber = Number(queryLimit) || defaultLimit;
    if (
      !Number.isInteger(limitNumber) ||
      !Number.isFinite(limitNumber) ||
      limitNumber < 1 ||
      limitNumber > limitMax
    ) {
      throw new BadRequestException(`invalid ?limit URL parameter`);
    }

    return { path: req.path, page: pageNumber, limit: limitNumber };
  },
);

export type Paginated<T> = {
  items: T[];
  totalCount: number;
  currentPageIndex: number;
  nextPageIndex: number | undefined;
  previousPageIndex: number | undefined;
  links: { next?: string; previous?: string };
};

export function paginate<T>(input: {
  items: readonly T[];
  totalCount: number;
  pagination: Pagination;
}): Paginated<T> {
  const { pagination } = input;
  const hasNext = pagination.page * pagination.limit < input.totalCount;
  const hasPrev = pagination.page > 1;

  const nextUrl = new URL(pagination.path, 'http://example.com');
  nextUrl.searchParams.set('page', String(pagination.page + 1));
  nextUrl.searchParams.set('limit', String(pagination.limit));
  const nextPath = nextUrl.toString().slice('http://example.com'.length);

  const prevUrl = new URL(pagination.path, 'http://example.com');
  prevUrl.searchParams.set('page', String(pagination.page - 1));
  prevUrl.searchParams.set('limit', String(pagination.limit));
  const prevPath = prevUrl.toString().slice('http://example.com'.length);

  return {
    items: input.items as T[],
    totalCount: input.totalCount,
    currentPageIndex: pagination.page,
    nextPageIndex: hasNext ? pagination.page + 1 : undefined,
    previousPageIndex: hasPrev ? pagination.page - 1 : undefined,
    links: {
      next: hasNext ? nextPath : undefined,
      previous: hasPrev ? prevPath : undefined,
    },
  };
}
