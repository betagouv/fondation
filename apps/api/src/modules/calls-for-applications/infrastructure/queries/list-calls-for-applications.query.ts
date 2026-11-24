import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import z from 'zod';

import { Prisma } from '../../../../generated/prisma/client';
import { DateOnly, dateOnlyJsonSchema } from '../../../../utils/date-only';
import { writerOf, writerSchema } from '../../../../utils/user.util';
import { Clock } from '../../../framework/clock';
import { Db } from '../../../framework/database';
import { createPaginatedZodDto, pageOf, paginate, Pagination } from '../../../framework/pagination';
import { Sortable } from '../../../framework/sorting';
import {
  CALL_FOR_APPLICATIONS_ACTIONS,
  CALL_FOR_APPLICATIONS_FIELDS,
  CALL_FOR_APPLICATIONS_STATUSES,
  type CallForApplicationsStatus,
  callForApplicationsFieldOf,
  canChange,
  callForApplicationsStatusOf,
  callForApplicationsTypeOf,
  TARGET_JURISDICTION_TYPES,
  type TargetJurisdictionType,
  targetJurisdictionTypeOf,
} from '../../domain/call-for-applications';
import { type CallForApplicationsPeriod, periodOf, yearsOf } from '../../domain/call-for-applications-period';
import {
  type CallForApplicationsSortableColumn,
  sortedCalls,
} from '../../domain/call-for-applications-sorting';
import {
  callForApplicationsFieldSchema,
  callForApplicationsStatusSchema,
  callForApplicationsTypeSchema,
  targetJurisdictionTypeSchema,
} from '../call-for-applications.dto';

@Injectable()
export class ListCallsForApplicationsQuery {
  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
  ) {}

  /** read whole: a few dozen calls a year, sorted and split by the rules of the domain */
  @Transactional()
  async handle(query: {
    actor: { isAdmin: boolean };
    pagination: Pagination;
    period: CallForApplicationsPeriod;
    sorting: Sortable<CallForApplicationsSortableColumn>;
    statuses: readonly CallForApplicationsStatus[];
    targetJurisdictionTypes: readonly TargetJurisdictionType[];
    years: readonly number[];
  }): Promise<ListedCallsForApplicationsDto> {
    const today = DateOnly.fromInstantInParis(this.clock.now());
    const rows = await this.db.tx.callForApplications.findMany({
      select: {
        comment: true,
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
    const listed = sortedCalls(
      calls
        .filter(
          (call) =>
            query.years.length === 0 || yearsOf(call, today).some((year) => query.years.includes(year)),
        )
        .filter((call) => query.statuses.length === 0 || query.statuses.includes(call.status))
        .filter(
          (call) =>
            query.targetJurisdictionTypes.length === 0 ||
            (!!call.targetJurisdictionType &&
              query.targetJurisdictionTypes.includes(call.targetJurisdictionType)),
        ),
      query.sorting,
    );

    const page = pageOf(listed, query.pagination);
    const changes = await this.db.tx.callForApplicationsChange.findMany({
      orderBy: [{ at: 'desc' }, { id: 'asc' }],
      select: {
        action: true,
        at: true,
        author: { select: { firstName: true, id: true, lastName: true } },
        callId: true,
        fields: { select: { field: true } },
      } satisfies Prisma.CallForApplicationsChangeSelect,
      where: { callId: { in: page.map(({ id }) => id) } },
    });

    return {
      ...paginate({
        items: page.map((call) => ({
          canChange: canChange(call, query.actor),
          comment: call.comment,
          createdOn: call.createdOn.toJson(),
          deadline: call.deadline?.toJson() ?? null,
          history: changes
            .filter(({ callId }) => callId === call.id)
            .map((change) => ({
              action: change.action,
              at: change.at.toISOString(),
              by: writerOf(change.author),
              fields: CALL_FOR_APPLICATIONS_FIELDS.filter((field) =>
                change.fields.some((changed) => changed.field === field),
              ).map(callForApplicationsFieldOf),
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
      years: [...new Set([today.toJson().year, ...calls.flatMap((call) => yearsOf(call, today))])].toSorted(
        (a, b) => b - a,
      ),
    };
  }
}

export class ListedCallsForApplicationsDto extends createPaginatedZodDto(
  z.object({
    /** whether the user may update or delete the call */
    canChange: z.boolean(),
    /** shown in the form of an update */
    comment: z.string().nullable(),
    createdOn: dateOnlyJsonSchema,
    deadline: dateOnlyJsonSchema.nullable(),
    /** what was done to the call, the latest first: never empty, it holds at least the creation */
    history: z.array(
      z.object({
        action: z.enum(CALL_FOR_APPLICATIONS_ACTIONS),
        at: z.iso.datetime(),
        by: writerSchema,
        /** the fields an update touched, in the order of the form */
        fields: z.array(callForApplicationsFieldSchema),
      }),
    ),
    id: z.uuid(),
    publishedOn: dateOnlyJsonSchema.nullable(),
    status: callForApplicationsStatusSchema,
    /** only a general call targets a type of jurisdiction */
    targetJurisdictionType: targetJurisdictionTypeSchema.nullable(),
    type: callForApplicationsTypeSchema,
  }),
  z.object({
    statuses: z.array(callForApplicationsStatusSchema),
    targetJurisdictionTypes: z.array(targetJurisdictionTypeSchema),
    /** the years with a call in the period, the most recent first */
    years: z.array(z.number().int()),
  }),
) {}
