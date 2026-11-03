import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { writerOf, writerSchema } from '../../../../utils/user.util';
import { Db } from '../../../framework/database';
import { createPaginatedZodDto, paginate, Pagination } from '../../../framework/pagination';
import { Sortable } from '../../../framework/sorting';
import { prismaRoleEnumToRoleEnum } from '../../../shared/mappers/role-enum.mapper';
import { userStatusOf } from '../../../shared/user-status.enum';
import { AuthUser } from '../../../simple-auth/domain/auth-user';
import { REMARK_STATUSES, type RemarkStatus } from '../../domain/remark';
import type { ListRemarksQueryDto } from '../remark.dto';

const PERSON = { select: { firstName: true, id: true, lastName: true } satisfies Prisma.UserSelect } as const;
const ACCOUNT = {
  select: {
    deactivatedAt: true,
    firstName: true,
    id: true,
    lastName: true,
    role: true,
  } satisfies Prisma.UserSelect,
} as const;

@Injectable()
export class ListRemarksQuery {
  constructor(private readonly db: Db) {}

  @Transactional()
  async handle(query: {
    pagination: Pagination;
    sorting: Sortable<ListRemarksQueryDto>;
    statuses: readonly RemarkStatus[];
  }): Promise<ListedRemarksDto> {
    const { limit, page } = query.pagination;
    const { sortBy, sortDesc } = query.sorting;
    const direction: Prisma.SortOrder = sortDesc ? 'desc' : 'asc';
    // the most recent first, by default and within a status
    const orderBy: Prisma.RemarkOrderByWithRelationInput[] = [
      ...(sortBy === 'status' ? [{ status: direction }] : []),
      { sentAt: sortBy === 'sentAt' ? direction : 'desc' },
      { id: 'asc' },
    ];
    const where = {
      status: query.statuses.length > 0 ? { in: [...query.statuses] } : undefined,
    } satisfies Prisma.RemarkWhereInput;
    const totalCount = await this.db.tx.remark.count({ where });
    const remarks = await this.db.tx.remark.findMany({
      orderBy,
      select: {
        author: ACCOUNT,
        id: true,
        impersonated: ACCOUNT,
        sentAt: true,
        status: true,
        statusChangedAt: true,
        statusChangedBy: PERSON,
        statusComment: true,
        text: true,
        url: true,
      } satisfies Prisma.RemarkSelect,
      skip: (page - 1) * limit,
      take: limit,
      where,
    });

    return paginate({
      items: remarks.map((remark) => ({
        author: writerOf(remark.author),
        id: remark.id,
        impersonated: writerOf(remark.impersonated),
        openAs: openableAs(remark.impersonated ?? remark.author),
        sentAt: remark.sentAt.toISOString(),
        status: {
          changedAt: remark.statusChangedAt?.toISOString() ?? null,
          changedBy: writerOf(remark.statusChangedBy),
          comment: remark.statusComment,
          value: remark.status,
        },
        text: remark.text,
        url: remark.url,
      })),
      pagination: query.pagination,
      totalCount,
    });
  }
}

/** the page reopens as the account it was seen from, when that account can still be impersonated */
function openableAs(account: {
  deactivatedAt: Date | null;
  firstName: string;
  id: string;
  lastName: string;
  role: Prisma.UserGetPayload<typeof ACCOUNT>['role'];
}) {
  const role = prismaRoleEnumToRoleEnum(account.role);
  return AuthUser.canBeImpersonated({ role, status: userStatusOf(account) }) ? writerOf(account) : null;
}

const ListedRemarkSchema = z.object({
  author: writerSchema,
  id: z.string(),
  impersonated: writerSchema,
  openAs: writerSchema,
  sentAt: z.iso.datetime(),
  status: z.object({
    changedAt: z.iso.datetime().nullable(),
    changedBy: writerSchema,
    comment: z.string().nullable(),
    value: z.enum(REMARK_STATUSES),
  }),
  text: z.string(),
  url: z.string(),
});

export class ListedRemarksDto extends createPaginatedZodDto(ListedRemarkSchema) {}
