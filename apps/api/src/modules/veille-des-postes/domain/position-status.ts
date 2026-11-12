export const POSITION_STATUSES = ['OCCUPIED', 'MAY_BECOME_VACANT', 'VACANT'] as const;
export type PositionStatus = (typeof POSITION_STATUSES)[number];

const LABELS: Record<PositionStatus, string> = {
  MAY_BECOME_VACANT: 'Susceptible de devenir vacant',
  OCCUPIED: 'Occupé',
  VACANT: 'Vacant',
};

/* until the alerts and the manual edition, every position held is occupied */
export const HELD_POSITION_STATUS: PositionStatus = 'OCCUPIED';

export function positionStatuses(): { id: PositionStatus; label: string }[] {
  return POSITION_STATUSES.map((id) => ({ id, label: LABELS[id] }));
}

export function positionStatusOf(id: PositionStatus): { id: PositionStatus; label: string } {
  return { id, label: LABELS[id] };
}

export function heldPositionMatches(statuses: readonly PositionStatus[]): boolean {
  return statuses.length === 0 || statuses.includes(HELD_POSITION_STATUS);
}
