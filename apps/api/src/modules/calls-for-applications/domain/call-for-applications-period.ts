import type { DateOnly } from '../../../utils/date-only';

export const CALL_FOR_APPLICATIONS_PERIODS = ['ONGOING', 'PAST'] as const;
export type CallForApplicationsPeriod = (typeof CALL_FOR_APPLICATIONS_PERIODS)[number];

type DatedCall = { createdOn: DateOnly; deadline: DateOnly | null; id: string; publishedOn: DateOnly | null };

/** a call is past once its deadline is over: on the deadline itself, candidates can still apply */
export function periodOf(call: Pick<DatedCall, 'deadline'>, today: DateOnly): CallForApplicationsPeriod {
  return call.deadline && call.deadline.toDate() < today.toDate() ? 'PAST' : 'ONGOING';
}

/**
 * every year its period of application spans, so that a call open across the new year stays in both: from its
 * publication (or its creation while it has none) to its deadline (or today while it has none, being still open)
 */
export function yearsOf(
  call: Pick<DatedCall, 'createdOn' | 'deadline' | 'publishedOn'>,
  today: DateOnly,
): number[] {
  const first = (call.publishedOn ?? call.createdOn).toJson().year;
  const last = Math.max(first, (call.deadline ?? today).toJson().year);
  return Array.from({ length: last - first + 1 }, (_, index) => first + index);
}

/** the latest publication first: a call without a publication date is still being prepared and comes first */
export function byPublication(a: DatedCall, b: DatedCall): number {
  if (!a.publishedOn !== !b.publishedOn) return a.publishedOn ? 1 : -1;

  return (
    (b.publishedOn?.toDate().getTime() ?? 0) - (a.publishedOn?.toDate().getTime() ?? 0) ||
    b.createdOn.toDate().getTime() - a.createdOn.toDate().getTime() ||
    a.id.localeCompare(b.id)
  );
}
