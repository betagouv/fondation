export const POSITION_STATUSES = ['OCCUPIED', 'MAY_BECOME_VACANT', 'VACANT'] as const;
export type PositionStatus = (typeof POSITION_STATUSES)[number];

const LABELS: Record<PositionStatus, string> = {
  MAY_BECOME_VACANT: 'Susceptible de devenir vacant',
  OCCUPIED: 'Occupé',
  VACANT: 'Vacant',
};

export function positionStatuses(): { id: PositionStatus; label: string }[] {
  return POSITION_STATUSES.map((id) => ({ id, label: LABELS[id] }));
}

/** until the manual edition, a position without holder is vacant and an alert makes a held one likely to be */
export function positionStatusOf(position: { alertCount: number; held: boolean }): {
  id: PositionStatus;
  label: string;
} {
  const id = !position.held ? 'VACANT' : position.alertCount > 0 ? 'MAY_BECOME_VACANT' : 'OCCUPIED';
  return { id, label: LABELS[id] };
}
