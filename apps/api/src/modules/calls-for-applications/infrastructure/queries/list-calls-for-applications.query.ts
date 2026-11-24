import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { DateOnly, dateOnlyJsonSchema } from '../../../../utils/date-only';
import { writerOf, writerSchema } from '../../../../utils/user.util';
import { Clock } from '../../../framework/clock';
import { Db } from '../../../framework/database';
import { createPaginatedZodDto, pageOf, paginate, Pagination } from '../../../framework/pagination';
import {
  CALL_FOR_APPLICATIONS_ACTIONS,
  CALL_FOR_APPLICATIONS_STATUSES,
  CALL_FOR_APPLICATIONS_TYPES,
  type CallForApplicationsStatus,
  callForApplicationsActionOf,
  callForApplicationsStatusOf,
  callForApplicationsTypeOf,
  TARGET_JURISDICTION_TYPES,
  type TargetJurisdictionType,
  targetJurisdictionTypeOf,
} from '../../domain/call-for-applications';
import {
  byPublication,
  type CallForApplicationsPeriod,
  periodOf,
  yearOf,
} from '../../domain/call-for-applications-period';

@Injectable()
export class ListCallsForApplicationsQuery {
  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
  ) {}

  /** read whole: a few dozen calls a year, sorted and split by the rules of the domain */
  @Transactional()
  async handle(query: {
    pagination: Pagination;
    period: CallForApplicationsPeriod;
    statuses: readonly CallForApplicationsStatus[];
    targetJurisdictionTypes: readonly TargetJurisdictionType[];
    years: readonly number[];
  }): Promise<ListedCallsForApplicationsDto> {
    const today = DateOnly.fromInstantInParis(this.clock.now());
    const rows = await this.db.tx.callForApplications.findMany({
      select: {
        createdOn: true,
        deadline: true,
        id: true,
        publishedOn: true,
        status: true,
        targetJurisdictionType: true,
        type: true,
      } satisfies Prisma.CallForApplicationsSelect,
    });
    const calls = rows
      .map((row) => ({
        ...row,
        createdOn: DateOnly.fromUtcDate(row.createdOn),
        deadline: DateOnly.fromOptionalUtcDate(row.deadline),
        publishedOn: DateOnly.fromOptionalUtcDate(row.publishedOn),
      }))
      .filter((call) => periodOf(call, today) === query.period);
    // an empty filter keeps every value
    const listed = calls
      .filter((call) => query.years.length === 0 || query.years.includes(yearOf(call)))
      .filter((call) => query.statuses.length === 0 || query.statuses.includes(call.status))
      .filter(
        (call) =>
          query.targetJurisdictionTypes.length === 0 ||
          (!!call.targetJurisdictionType &&
            query.targetJurisdictionTypes.includes(call.targetJurisdictionType)),
      )
      .toSorted(byPublication);

    const page = pageOf(listed, query.pagination);
    const changes = await this.db.tx.callForApplicationsChange.findMany({
      orderBy: [{ at: 'desc' }, { id: 'asc' }],
      select: {
        action: true,
        at: true,
        author: { select: { firstName: true, id: true, lastName: true } },
        callId: true,
      } satisfies Prisma.CallForApplicationsChangeSelect,
      where: { callId: { in: page.map(({ id }) => id) } },
    });

    return {
      ...paginate({
        items: page.map((call) => ({
          createdOn: call.createdOn.toJson(),
          deadline: call.deadline?.toJson() ?? null,
          history: changes
            .filter(({ callId }) => callId === call.id)
            .map((change) => ({
              action: callForApplicationsActionOf(change.action),
              at: change.at.toISOString(),
              by: writerOf(change.author),
            })),
          id: call.id,
          publishedOn: call.publishedOn?.toJson() ?? null,
          status: callForApplicationsStatusOf(call.status),
          targetJurisdictionType:
            call.targetJurisdictionType && targetJurisdictionTypeOf(call.targetJurisdictionType),
          type: callForApplicationsTypeOf(call.type),
        })),
        pagination: query.pagination,
        totalCount: listed.length,
      }),
      statuses: CALL_FOR_APPLICATIONS_STATUSES.map(callForApplicationsStatusOf),
      targetJurisdictionTypes: TARGET_JURISDICTION_TYPES.map(targetJurisdictionTypeOf),
      // the current year stays offered even before its first call
      years: [...new Set([today.toJson().year, ...calls.map(yearOf)])].toSorted((a, b) => b - a),
    };
  }
}

export class ListedCallsForApplicationsDto extends createPaginatedZodDto(
  z.object({
    createdOn: dateOnlyJsonSchema,
    deadline: dateOnlyJsonSchema.nullable(),
    /** what was done to the call, the latest first: never empty, it holds at least the creation */
    history: z.array(
      z.object({
        action: z.object({ id: z.enum(CALL_FOR_APPLICATIONS_ACTIONS), label: z.string() }),
        at: z.iso.datetime(),
        by: writerSchema,
      }),
    ),
    id: z.uuid(),
    publishedOn: dateOnlyJsonSchema.nullable(),
    status: z.object({ id: z.enum(CALL_FOR_APPLICATIONS_STATUSES), label: z.string() }),
    /** only a general call targets a type of jurisdiction */
    targetJurisdictionType: z.object({ id: z.enum(TARGET_JURISDICTION_TYPES), label: z.string() }).nullable(),
    type: z.object({ id: z.enum(CALL_FOR_APPLICATIONS_TYPES), label: z.string() }),
  }),
  z.object({
    statuses: z.array(z.object({ id: z.enum(CALL_FOR_APPLICATIONS_STATUSES), label: z.string() })),
    targetJurisdictionTypes: z.array(z.object({ id: z.enum(TARGET_JURISDICTION_TYPES), label: z.string() })),
    /** the years with a call in the period, the most recent first */
    years: z.array(z.number().int()),
  }),
) {}
