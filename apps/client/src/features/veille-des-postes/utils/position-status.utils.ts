import type { PositionStatus } from '@queries/veille-des-postes.queries';

const KNOWN_STATUSES: Record<PositionStatus, true> = {
  MAY_BECOME_VACANT: true,
  OCCUPIED: true,
  VACANT: true,
};

/** a saved or hand-edited link can hold anything: only an array of ids the API knows reaches it */
export function knownPositionStatuses(value: unknown): PositionStatus[] {
  return Array.isArray(value)
    ? value.filter((id): id is PositionStatus => typeof id === 'string' && id in KNOWN_STATUSES)
    : [];
}
