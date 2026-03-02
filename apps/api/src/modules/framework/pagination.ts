import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

export type Pagination = { path: string; page: number; limit: number };

class PaginationQueryDto extends createZodDto(
  z.object({
    page: z.number().int().gte(1).optional(),
    limit: z.number().int().gte(1).optional(),
  }),
) {}

/** exposes the right openapi schema for the query pagination */
export function ApiPaginated(): MethodDecorator {
  return ApiQuery({ type: PaginationQueryDto });
}

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

type Paginated<T> = {
  items: T[];
  totalCount: number;
  currentPageIndex: number;
  nextPageIndex: number | undefined;
  previousPageIndex: number | undefined;
  links: { next?: string; previous?: string };
};

export function createPaginatedZodDto(
  schema: z.ZodObject,
  extension?: z.ZodObject,
) {
  return createZodDto(
    z
      .object({
        items: z.array(schema),
        totalCount: z.number().int().gte(0),
        currentPageIndex: z.number().int().gte(1),
        nextPageIndex: z.number().int().gte(2).optional(),
        previousPageIndex: z.number().int().gte(1).optional(),
        links: z
          .object({
            next: z.string().optional(),
            previous: z.string().optional(),
          })
          .optional(),
      })
      .safeExtend(extension?.shape ?? {}),
  );
}

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
