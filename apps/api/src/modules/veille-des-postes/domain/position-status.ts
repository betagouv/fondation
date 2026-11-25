import type { DateOnly } from '../../../utils/date-only';
import { frenchDate } from '../../../utils/french-date';

import { isDetailRequired, type VacancyReason, vacancyReasonOf } from './position-vacancy';

export const POSITION_STATUSES = ['OCCUPIED', 'MAY_BECOME_VACANT', 'VACANT'] as const;
export type PositionStatus = (typeof POSITION_STATUSES)[number];

/** before a date, "Retraite depuis le 12/11/2026": "Autre" alone would not read */
function reasonInDetail(reason: VacancyReason): string {
  return reason === 'OTHER' ? 'Autre motif' : vacancyReasonOf(reason).label;
}

const LABELS: Record<PositionStatus, string> = {
  MAY_BECOME_VACANT: 'Susceptible de devenir vacant',
  OCCUPIED: 'Occupé',
  VACANT: 'Vacant',
};

export function positionStatuses(): { id: PositionStatus; label: string }[] {
  return POSITION_STATUSES.map((id) => ({ id, label: LABELS[id] }));
}

type Status = { detail: string | null; hint: string | null; id: PositionStatus; label: string };

/**
 * a position without holder is vacant. A vacancy declared on its holder makes it vacant from its start date
 * and likely to be until then. Otherwise an alert makes it likely to become vacant
 */
export function positionStatusOf(
  position: {
    alertCount: number;
    held: boolean;
    vacancy: { reason: VacancyReason; reasonDetail: string | null; startDate: DateOnly } | null;
  },
  today: DateOnly,
): Status {
  if (!position.held) return { detail: null, hint: null, id: 'VACANT', label: LABELS.VACANT };

  const { vacancy } = position;
  if (vacancy) {
    const reason = reasonInDetail(vacancy.reason);
    const date = frenchDate(vacancy.startDate);
    // the detail of "other" can be long: the tables show it on hover
    const hint = isDetailRequired(vacancy.reason) ? vacancy.reasonDetail : null;
    return vacancy.startDate.toDate().getTime() <= today.toDate().getTime()
      ? { detail: `${reason} depuis le ${date}`, hint, id: 'VACANT', label: LABELS.VACANT }
      : {
          detail: `${reason} à compter du ${date}`,
          hint,
          id: 'MAY_BECOME_VACANT',
          label: LABELS.MAY_BECOME_VACANT,
        };
  }

  const id = position.alertCount > 0 ? 'MAY_BECOME_VACANT' : 'OCCUPIED';
  return { detail: null, hint: null, id, label: LABELS[id] };
}
