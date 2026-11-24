import type { DateOnly } from '../../../utils/date-only';

export const CALL_FOR_APPLICATIONS_PERIODS = ['ONGOING', 'PAST'] as const;
export type CallForApplicationsPeriod = (typeof CALL_FOR_APPLICATIONS_PERIODS)[number];

type DatedCall = { createdOn: DateOnly; deadline: DateOnly | null; id: string; publishedOn: DateOnly | null };

/** a call is past once its deadline is over: on the deadline itself, candidates can still apply */
export function periodOf(call: Pick<DatedCall, 'deadline'>, today: DateOnly): CallForApplicationsPeriod {
  return call.deadline && call.deadline.toDate() < today.toDate() ? 'PAST' : 'ONGOING';
}

/**
 * from the earliest of its creation and publication to the latest of its publication and deadline. Without deadline it
 * runs until today since it is still open
 */
export function yearsOf(
  call: Pick<DatedCall, 'createdOn' | 'deadline' | 'publishedOn'>,
  today: DateOnly,
): number[] {
  const created = call.createdOn.toJson().year;
  const published = call.publishedOn?.toJson().year ?? created;
  const first = Math.min(created, published);
  const last = Math.max(created, published, (call.deadline ?? today).toJson().year);
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
