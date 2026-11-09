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
import { FEEDBACK_STATUSES, type FeedbackStatus } from '../../domain/feedback';
import type { ListFeedbacksQueryDto } from '../feedback.dto';

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
export class ListFeedbacksQuery {
  constructor(private readonly db: Db) {}

  @Transactional()
  async handle(query: {
    pagination: Pagination;
    sorting: Sortable<ListFeedbacksQueryDto>;
    statuses: readonly FeedbackStatus[];
  }): Promise<ListedFeedbacksDto> {
    const { limit, page } = query.pagination;
    const { sortBy, sortDesc } = query.sorting;
    const direction: Prisma.SortOrder = sortDesc ? 'desc' : 'asc';
    // the most recent first, by default and within a status
    const orderBy: Prisma.FeedbackOrderByWithRelationInput[] = [
      ...(sortBy === 'status' ? [{ status: direction }] : []),
      { sentAt: sortBy === 'sentAt' ? direction : 'desc' },
      { id: 'asc' },
    ];
    const where = {
      status: query.statuses.length > 0 ? { in: [...query.statuses] } : undefined,
    } satisfies Prisma.FeedbackWhereInput;
    const totalCount = await this.db.tx.feedback.count({ where });
    const feedbacks = await this.db.tx.feedback.findMany({
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
      } satisfies Prisma.FeedbackSelect,
      skip: (page - 1) * limit,
      take: limit,
      where,
    });

    return paginate({
      items: feedbacks.map((feedback) => ({
        author: writerOf(feedback.author),
        id: feedback.id,
        impersonated: writerOf(feedback.impersonated),
        openAs: openableAs(feedback.impersonated ?? feedback.author),
        sentAt: feedback.sentAt.toISOString(),
        status: {
          changedAt: feedback.statusChangedAt?.toISOString() ?? null,
          changedBy: writerOf(feedback.statusChangedBy),
          comment: feedback.statusComment,
          value: feedback.status,
        },
        text: feedback.text,
        url: feedback.url,
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

const ListedFeedbackSchema = z.object({
  author: writerSchema,
  id: z.string(),
  impersonated: writerSchema,
  openAs: writerSchema,
  sentAt: z.iso.datetime(),
  status: z.object({
    changedAt: z.iso.datetime().nullable(),
    changedBy: writerSchema,
    comment: z.string().nullable(),
    value: z.enum(FEEDBACK_STATUSES),
  }),
  text: z.string(),
  url: z.string(),
});

export class ListedFeedbacksDto extends createPaginatedZodDto(ListedFeedbackSchema) {}

export type ListedFeedback = z.infer<typeof ListedFeedbackSchema>;
