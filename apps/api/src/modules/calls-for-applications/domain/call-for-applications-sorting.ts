import type { DateOnly } from '../../../utils/date-only';

import {
  CALL_FOR_APPLICATIONS_STATUSES,
  CALL_FOR_APPLICATIONS_TYPES,
  type CallForApplicationsStatus,
  type CallForApplicationsType,
} from './call-for-applications';
import { byPublication } from './call-for-applications-period';

export const CALL_FOR_APPLICATIONS_SORTABLE_COLUMNS = [
  'createdOn',
  'deadline',
  'publishedOn',
  'status',
  'type',
] as const;
export type CallForApplicationsSortableColumn = (typeof CALL_FOR_APPLICATIONS_SORTABLE_COLUMNS)[number];

type SortedCall = {
  createdOn: DateOnly;
  deadline: DateOnly | null;
  id: string;
  publishedOn: DateOnly | null;
  status: CallForApplicationsStatus;
  type: CallForApplicationsType;
};

function sortValueOf(call: SortedCall, column: CallForApplicationsSortableColumn): number | null {
  switch (column) {
    case 'createdOn':
      return call.createdOn.toDate().getTime();
    case 'deadline':
      return call.deadline?.toDate().getTime() ?? null;
    case 'publishedOn':
      return call.publishedOn?.toDate().getTime() ?? null;
    case 'status':
      return CALL_FOR_APPLICATIONS_STATUSES.indexOf(call.status);
    case 'type':
      return CALL_FOR_APPLICATIONS_TYPES.indexOf(call.type);
  }
}

/**
 * without a column picked, the order of the spec. With one, a call without value comes last whatever the direction,
 * and ties go to the latest created then to the id, so that the order stays the same from one page to the next
 */
export function sortedCalls<Call extends SortedCall>(
  calls: readonly Call[],
  sorting: { sortBy: CallForApplicationsSortableColumn | undefined; sortDesc: boolean },
): Call[] {
  const { sortBy } = sorting;
  if (!sortBy) return calls.toSorted(byPublication);

  const direction = sorting.sortDesc ? -1 : 1;
  return calls.toSorted((a, b) => {
    const [first, second] = [sortValueOf(a, sortBy), sortValueOf(b, sortBy)];
    if (first === null || second === null) {
      if (first !== second) return first === null ? 1 : -1;
    } else if (first !== second) return (first - second) * direction;

    return b.createdOn.toDate().getTime() - a.createdOn.toDate().getTime() || a.id.localeCompare(b.id);
  });
}
