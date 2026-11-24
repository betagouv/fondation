import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { commentLastChangeSchema } from '../../../../utils/comment';
import { DateOnly, dateOnlyJsonSchema } from '../../../../utils/date-only';
import { writerOf } from '../../../../utils/user.util';
import { Db } from '../../../framework/database';
import { createPaginatedZodDto, paginate, Pagination } from '../../../framework/pagination';
import {
  CALL_FOR_APPLICATIONS_STATUSES,
  CALL_FOR_APPLICATIONS_TYPES,
  callForApplicationsStatusOf,
  callForApplicationsTypeOf,
  TARGET_JURISDICTION_TYPES,
  targetJurisdictionTypeOf,
} from '../../domain/call-for-applications';

@Injectable()
export class ListCallsForApplicationsQuery {
  constructor(private readonly db: Db) {}

  @Transactional()
  async handle({ pagination }: { pagination: Pagination }): Promise<ListedCallsForApplicationsDto> {
    const calls = await this.db.tx.callForApplications.findMany({
      // a call not dated yet is the one being prepared: it comes first
      orderBy: [{ publishedOn: { nulls: 'first', sort: 'desc' } }, { createdOn: 'desc' }, { id: 'asc' }],
      select: {
        author: { select: { firstName: true, id: true, lastName: true } },
        createdOn: true,
        deadline: true,
        id: true,
        publishedOn: true,
        status: true,
        targetJurisdictionType: true,
        type: true,
        updatedAt: true,
      } satisfies Prisma.CallForApplicationsSelect,
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    });

    return paginate({
      items: calls.map((call) => ({
        createdOn: DateOnly.fromUtcDate(call.createdOn).toJson(),
        deadline: call.deadline && DateOnly.fromUtcDate(call.deadline).toJson(),
        id: call.id,
        lastChange: { at: call.updatedAt.toISOString(), by: writerOf(call.author) },
        publishedOn: call.publishedOn && DateOnly.fromUtcDate(call.publishedOn).toJson(),
        status: callForApplicationsStatusOf(call.status),
        targetJurisdictionType:
          call.targetJurisdictionType && targetJurisdictionTypeOf(call.targetJurisdictionType),
        type: callForApplicationsTypeOf(call.type),
      })),
      pagination,
      totalCount: await this.db.tx.callForApplications.count(),
    });
  }
}

export class ListedCallsForApplicationsDto extends createPaginatedZodDto(
  z.object({
    createdOn: dateOnlyJsonSchema,
    deadline: dateOnlyJsonSchema.nullable(),
    id: z.uuid(),
    lastChange: commentLastChangeSchema,
    publishedOn: dateOnlyJsonSchema.nullable(),
    status: z.object({ id: z.enum(CALL_FOR_APPLICATIONS_STATUSES), label: z.string() }),
    /** only a general call targets a type of jurisdiction */
    targetJurisdictionType: z.object({ id: z.enum(TARGET_JURISDICTION_TYPES), label: z.string() }).nullable(),
    type: z.object({ id: z.enum(CALL_FOR_APPLICATIONS_TYPES), label: z.string() }),
  }),
) {}
