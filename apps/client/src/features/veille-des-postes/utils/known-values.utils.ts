import type { PositionStatus } from '@queries/veille-des-postes.queries';

export const KNOWN_STATUSES: Record<PositionStatus, true> = {
  MAY_BECOME_VACANT: true,
  OCCUPIED: true,
  VACANT: true,
};

/** a saved or hand-edited link can hold anything: only an array of ids the API knows reaches it */
export function knownValues<Id extends string>(value: unknown, known: Record<Id, true>): Id[] {
  return Array.isArray(value)
    ? value.filter((id): id is Id => typeof id === 'string' && Object.hasOwn(known, id))
    : [];
}

/** the same for values the client cannot list, which the API reads only as filters */
export function stringValues(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
}
