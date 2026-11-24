import type { DateOnly } from '../../../utils/date-only';

import {
  type AlertDeadline,
  deadlineOf,
  deadlinesOf,
  type HolderAlert,
  type PositionAlert,
} from './position-alert';
import type { PositionStatus } from './position-status';

export type AskedAlerts = { alert: readonly string[]; deadline: readonly string[] };
export type AssessedPosition = {
  alerts: HolderAlert[];
  status: { id: PositionStatus };
  vacancyStartDate: DateOnly | null;
};

function ofAsked(asked: AskedAlerts, alert: HolderAlert): boolean {
  return (
    (asked.alert.length === 0 || asked.alert.includes(alert.id)) &&
    (asked.deadline.length === 0 ||
      deadlinesOf([alert]).some((deadline) => asked.deadline.includes(deadline)))
  );
}

/** a declared vacancy is no alert: its start date answers the filter and the sort only while no alert is asked */
function askedVacancyStartDate(asked: AskedAlerts, position: Pick<AssessedPosition, 'vacancyStartDate'>) {
  return asked.alert.length === 0 ? position.vacancyStartDate : null;
}

/**
 * the alert and its deadline go together: "retirement within six months" leaves out a retirement in ten
 * months, even beside a proposal next month
 */
export function alertFacetValues(
  asked: AskedAlerts,
  today: DateOnly,
): {
  alert: (alerts: readonly HolderAlert[]) => PositionAlert[];
  deadline: (position: Pick<AssessedPosition, 'alerts' | 'vacancyStartDate'>) => AlertDeadline[];
} {
  return {
    alert: (alerts) => alerts.filter((alert) => ofAsked({ ...asked, alert: [] }, alert)).map(({ id }) => id),
    deadline: (position) => {
      const vacancyStartDate = askedVacancyStartDate(asked, position);
      return deadlinesOf([
        ...position.alerts.filter((alert) => ofAsked({ ...asked, deadline: [] }, alert)),
        ...(vacancyStartDate ? [{ deadline: deadlineOf(vacancyStartDate, today) }] : []),
      ]);
    },
  };
}

/**
 * by urgency: a vacancy is due already, then the earliest of a vacancy declared ahead and the alerts asked, and
 * the positions occupied without alert last whatever the direction
 */
export function sortedByUrgency<Position extends AssessedPosition>(
  positions: readonly Position[],
  asked: AskedAlerts,
  desc: boolean,
): Position[] {
  const dueTime = (position: Position) => {
    if (position.status.id === 'VACANT') return Number.NEGATIVE_INFINITY;

    const times = [
      askedVacancyStartDate(asked, position),
      position.alerts.find((alert) => ofAsked(asked, alert))?.dueDate,
    ].flatMap((date) => (date ? [date.toDate().getTime()] : []));
    return times.length > 0 ? Math.min(...times) : undefined;
  };

  return positions.toSorted((a, b) => {
    const [aTime, bTime] = [dueTime(a), dueTime(b)];
    if (aTime === undefined || bTime === undefined)
      return Number(aTime === undefined) - Number(bTime === undefined);
    if (aTime === bTime) return 0;
    return (desc ? aTime < bTime : aTime > bTime) ? 1 : -1;
  });
}
