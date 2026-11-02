import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { writerOf, writerSchema } from '../../../../utils/user.util';
import { Db } from '../../../framework/database';
import { createPaginatedZodDto, paginate, Pagination } from '../../../framework/pagination';
import { Remark, REMARK_STATUSES } from '../../domain/remark';

const PERSON = { select: { firstName: true, id: true, lastName: true } satisfies Prisma.UserSelect } as const;

@Injectable()
export class ListRemarksQuery {
  constructor(private readonly db: Db) {}

  @Transactional()
  async handle(query: { pagination: Pagination }): Promise<PaginatedRemarkListItemDto> {
    const { limit, page } = query.pagination;
    const totalCount = await this.db.tx.remark.count();
    const remarks = await this.db.tx.remark.findMany({
      orderBy: [{ sentAt: 'desc' }, { id: 'asc' }],
      select: {
        author: PERSON,
        id: true,
        impersonated: PERSON,
        sentAt: true,
        statusChanges: {
          orderBy: { changedAt: 'desc' },
          select: { author: PERSON, changedAt: true, status: true },
        },
        text: true,
        url: true,
      } satisfies Prisma.RemarkSelect,
      skip: (page - 1) * limit,
      take: limit,
    });

    return paginate({
      items: remarks.map((remark) => ({
        author: writerOf(remark.author),
        id: remark.id,
        impersonated: writerOf(remark.impersonated),
        sentAt: remark.sentAt.toISOString(),
        status: Remark.statusOf(remark.statusChanges),
        statusChanges: remark.statusChanges.map((change) => ({
          at: change.changedAt.toISOString(),
          by: writerOf(change.author),
          status: change.status,
        })),
        text: remark.text,
        url: remark.url,
      })),
      pagination: query.pagination,
      totalCount,
    });
  }
}

const RemarkListItemDtoSchema = z.object({
  author: writerSchema,
  id: z.string(),
  impersonated: writerSchema,
  sentAt: z.iso.datetime(),
  status: z.enum(REMARK_STATUSES),
  statusChanges: z.array(
    z.object({ at: z.iso.datetime(), by: writerSchema, status: z.enum(REMARK_STATUSES) }),
  ),
  text: z.string(),
  url: z.string(),
});

export class PaginatedRemarkListItemDto extends createPaginatedZodDto(RemarkListItemDtoSchema) {}
