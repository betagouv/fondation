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
  COURT_OF_CASSATION_POSITIONS,
  type CourtOfCassationPosition,
} from '../../../shared/court-of-cassation-position.enum';
import {
  type AddedAndRemoved,
  CALL_FOR_APPLICATIONS_ACTIONS,
  CALL_FOR_APPLICATIONS_FIELDS,
  CALL_FOR_APPLICATIONS_STATUSES,
  CALL_FOR_APPLICATIONS_TYPES,
  type CallForApplicationsField,
  type CallForApplicationsFieldChange,
  type CallForApplicationsStatus,
  type CallForApplicationsType,
  type LolfiCourt,
  callForApplicationsStatusOf,
  callForApplicationsTypeOf,
  canChange,
  sortedByHierarchy,
  sortedCourts,
  targetCourtOf,
  targetLabelOf,
  targetPositionOf,
} from '../../domain/call-for-applications';
import {
  callForApplicationsChangedFieldEntriesOf,
  type ChangedItem,
} from '../../domain/call-for-applications-history';
import { type CallForApplicationsPeriod, periodOf, yearsOf } from '../../domain/call-for-applications-period';
import {
  type CallForApplicationsSortableColumn,
  sortedCalls,
} from '../../domain/call-for-applications-sorting';
import {
  callForApplicationsFieldChangeSchema,
  callForApplicationsStatusSchema,
  callForApplicationsTypeSchema,
  changedTargetSchema,
  targetCourtSchema,
  targetPositionSchema,
} from '../call-for-applications.dto';

type JournaledItem = { fieldChange: CallForApplicationsFieldChange; label: string };

function addedAndRemovedOf(items: readonly JournaledItem[]): AddedAndRemoved<ChangedItem> {
  const labelsWith = (change: CallForApplicationsFieldChange) =>
    items.filter(({ fieldChange }) => fieldChange === change).map(({ label }) => ({ label }));
  return { added: labelsWith('ADDED'), removed: labelsWith('REMOVED') };
}

/** the courts or the positions a change journaled for the field (none for another field) */
function changedItemsOf(
  field: CallForApplicationsField,
  change: {
    changedCourts: readonly { court: LolfiCourt; fieldChange: CallForApplicationsFieldChange }[];
    changedPositions: readonly {
      fieldChange: CallForApplicationsFieldChange;
      position: CourtOfCassationPosition;
    }[];
  },
): AddedAndRemoved<ChangedItem> {
  if (field === 'TARGET_COURTS')
    return addedAndRemovedOf(
      sortedCourts(change.changedCourts.map(({ court, fieldChange }) => ({ ...court, fieldChange }))).map(
        (court) => ({ fieldChange: court.fieldChange, label: targetCourtOf(court).label }),
      ),
    );
  if (field === 'TARGET_POSITIONS')
    return addedAndRemovedOf(
      COURT_OF_CASSATION_POSITIONS.flatMap((position) =>
        change.changedPositions
          .filter((changed) => changed.position === position)
          .map(({ fieldChange }) => ({ fieldChange, label: targetPositionOf(position).label })),
      ),
    );
  return { added: [], removed: [] };
}

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
    types: readonly CallForApplicationsType[];
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
        targetCourts: {
          select: { court: { select: { codejur: true, libelle: true, typeJur: true, ville_jur: true } } },
        },
        targetPositions: { select: { position: true } },
        type: true,
      } satisfies Prisma.CallForApplicationsSelect,
    });
    const calls = rows
      .map((row) => ({
        ...row,
        createdOn: DateOnly.fromUtcDate(row.createdOn),
        deadline: DateOnly.fromOptionalUtcDate(row.deadline),
        publishedOn: DateOnly.fromOptionalUtcDate(row.publishedOn),
        targetCourts: sortedCourts(row.targetCourts.map(({ court }) => court)).map(targetCourtOf),
        targetPositions: sortedByHierarchy(row.targetPositions.map(({ position }) => position)),
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
        .filter((call) => query.types.length === 0 || query.types.includes(call.type)),
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
        changedCourts: {
          select: {
            court: { select: { codejur: true, libelle: true, typeJur: true, ville_jur: true } },
            fieldChange: true,
          },
        },
        changedPositions: { select: { fieldChange: true, position: true } },
        fields: {
          select: {
            dateAfter: true,
            dateBefore: true,
            field: true,
            fieldChange: true,
            typeAfter: true,
            typeBefore: true,
          },
        },
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
              changes: change.fields
                .toSorted(
                  (a, b) =>
                    CALL_FOR_APPLICATIONS_FIELDS.indexOf(a.field) -
                    CALL_FOR_APPLICATIONS_FIELDS.indexOf(b.field),
                )
                .flatMap(({ fieldChange, ...journaled }) =>
                  callForApplicationsChangedFieldEntriesOf(
                    {
                      ...journaled,
                      change: fieldChange,
                      dateAfter: DateOnly.fromOptionalUtcDate(journaled.dateAfter),
                      dateBefore: DateOnly.fromOptionalUtcDate(journaled.dateBefore),
                    },
                    changedItemsOf(journaled.field, change),
                  ),
                ),
            })),
          id: call.id,
          publishedOn: call.publishedOn?.toJson() ?? null,
          status: callForApplicationsStatusOf(call.status),
          targetCourts: call.targetCourts,
          targetLabel: targetLabelOf(call),
          targetPositions: call.targetPositions.map(targetPositionOf),
          type: callForApplicationsTypeOf(call.type),
        })),
        pagination: query.pagination,
        totalCount: listed.length,
      }),
      statuses: CALL_FOR_APPLICATIONS_STATUSES.map(callForApplicationsStatusOf),
      types: CALL_FOR_APPLICATIONS_TYPES.map(callForApplicationsTypeOf),
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
        /** what an update did in the order of the form: a list changed both ways gives two entries */
        changes: z.array(
          z.object({
            change: callForApplicationsFieldChangeSchema,
            /** the field as the sentence names it after the verb with its values or its items */
            label: z.string(),
            /** the courts or the positions too many to name in the sentence (null when the sentence names them) */
            targets: z
              .object({ added: z.array(changedTargetSchema), removed: z.array(changedTargetSchema) })
              .nullable(),
          }),
        ),
      }),
    ),
    id: z.uuid(),
    publishedOn: dateOnlyJsonSchema.nullable(),
    status: callForApplicationsStatusSchema,
    /** the courts picked to fill the form of an update */
    targetCourts: z.array(targetCourtSchema),
    /** what the call targets as the list shows it */
    targetLabel: z.string(),
    /** the positions picked to fill the form of an update */
    targetPositions: z.array(targetPositionSchema),
    type: callForApplicationsTypeSchema,
  }),
  z.object({
    statuses: z.array(callForApplicationsStatusSchema),
    types: z.array(callForApplicationsTypeSchema),
    /** the years with a call in the period, the most recent first */
    years: z.array(z.number().int()),
  }),
) {}
