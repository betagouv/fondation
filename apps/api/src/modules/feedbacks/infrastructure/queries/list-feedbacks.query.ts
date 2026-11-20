import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { listFeedbackIdsRawQuery } from '../../../../generated/prisma/sql';
import { writerOf, writerSchema } from '../../../../utils/user.util';
import { Clock } from '../../../framework/clock';
import { Db } from '../../../framework/database';
import { createPaginatedZodDto, paginate, Pagination } from '../../../framework/pagination';
import { Sortable } from '../../../framework/sorting';
import { prismaRoleEnumToRoleEnum } from '../../../shared/mappers/role-enum.mapper';
import { userStatusOf } from '../../../shared/user-status.enum';
import { AuthUser } from '../../../simple-auth/domain/auth-user';
import { FEEDBACK_STATUSES, type FeedbackAge, type FeedbackStatus, sentBefore } from '../../domain/feedback';
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
  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
  ) {}

  @Transactional()
  async handle(query: {
    pagination: Pagination;
    search: string | undefined;
    sentAgo: FeedbackAge | undefined;
    sorting: Sortable<ListFeedbacksQueryDto>;
    statuses: readonly FeedbackStatus[];
  }): Promise<ListedFeedbacksDto> {
    const { limit, page } = query.pagination;
    const [listed] = await this.db.tx.$queryRawTyped(
      listFeedbackIdsRawQuery(
        (query.search ?? '').split(/\s+/).filter(Boolean),
        [...query.statuses],
        query.sentAgo ? sentBefore(query.sentAgo, this.clock.now()) : null,
        query.sorting.sortBy ?? null,
        query.sorting.sortDesc,
        limit,
        (page - 1) * limit,
      ),
    );
    const ids = listed?.ids ?? [];
    const feedbacks = await this.db.tx.feedback.findMany({
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
      where: { id: { in: ids } },
    });
    const byId = new Map(feedbacks.map((feedback) => [feedback.id, feedback]));

    const counts = statusCountsSchema.parse(listed?.statusCounts ?? {});

    return {
      ...paginate({
        items: ids
          .flatMap((id) => byId.get(id) ?? [])
          .map((feedback) => ({
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
        totalCount: listed?.totalCount ?? 0,
      }),
      statuses: FEEDBACK_STATUSES.map((id) => ({ count: counts[id] ?? 0, id })),
    };
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

const statusCountsSchema = z.partialRecord(z.enum(FEEDBACK_STATUSES), z.number());

export class ListedFeedbacksDto extends createPaginatedZodDto(
  ListedFeedbackSchema,
  z.object({ statuses: z.array(z.object({ count: z.number(), id: z.enum(FEEDBACK_STATUSES) })) }),
) {}
