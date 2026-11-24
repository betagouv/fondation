import type { DateOnly } from '../../../utils/date-only';

export const CALL_FOR_APPLICATIONS_PERIODS = ['ONGOING', 'PAST'] as const;
export type CallForApplicationsPeriod = (typeof CALL_FOR_APPLICATIONS_PERIODS)[number];

type DatedCall = { createdOn: DateOnly; deadline: DateOnly | null; id: string; publishedOn: DateOnly | null };

/** a call is past once its deadline is over: on the deadline itself, candidates can still apply */
export function periodOf(call: Pick<DatedCall, 'deadline'>, today: DateOnly): CallForApplicationsPeriod {
  return call.deadline && call.deadline.toDate() < today.toDate() ? 'PAST' : 'ONGOING';
}

/** the year of its publication, or of its creation while it has no publication date */
export function yearOf(call: Pick<DatedCall, 'createdOn' | 'publishedOn'>): number {
  return (call.publishedOn ?? call.createdOn).toJson().year;
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
