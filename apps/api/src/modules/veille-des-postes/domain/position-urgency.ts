import { type AlertDeadline, deadlinesOf, type HolderAlert, type PositionAlert } from './position-alert';
import type { PositionStatus } from './position-status';

export type AskedAlerts = { alert: readonly string[]; deadline: readonly string[] };
type AssessedPosition = { alerts: HolderAlert[]; status: { id: PositionStatus } };

function ofAsked(asked: AskedAlerts, alert: HolderAlert): boolean {
  return (
    (asked.alert.length === 0 || asked.alert.includes(alert.id)) &&
    (asked.deadline.length === 0 ||
      deadlinesOf([alert]).some((deadline) => asked.deadline.includes(deadline)))
  );
}

/**
 * the alert and its deadline go together: "retirement within six months" leaves out a retirement in ten
 * months, even beside a proposal next month
 */
export function alertFacetValues(asked: AskedAlerts): {
  alert: (alerts: readonly HolderAlert[]) => PositionAlert[];
  deadline: (alerts: readonly HolderAlert[]) => AlertDeadline[];
} {
  return {
    alert: (alerts) => alerts.filter((alert) => ofAsked({ ...asked, alert: [] }, alert)).map(({ id }) => id),
    deadline: (alerts) => deadlinesOf(alerts.filter((alert) => ofAsked({ ...asked, deadline: [] }, alert))),
  };
}

/**
 * by urgency: a vacancy is due already, then the earliest alert among those asked, and the positions
 * occupied without alert last whatever the direction
 */
export function sortedByUrgency<Position extends AssessedPosition>(
  positions: readonly Position[],
  asked: AskedAlerts,
  desc: boolean,
): Position[] {
  const dueTime = (position: Position) =>
    position.status.id === 'VACANT'
      ? Number.NEGATIVE_INFINITY
      : position.alerts
          .find((alert) => ofAsked(asked, alert))
          ?.dueDate.toDate()
          .getTime();

  return positions.toSorted((a, b) => {
    const [aTime, bTime] = [dueTime(a), dueTime(b)];
    if (aTime === undefined || bTime === undefined)
      return Number(aTime === undefined) - Number(bTime === undefined);
    if (aTime === bTime) return 0;
    return (desc ? aTime < bTime : aTime > bTime) ? 1 : -1;
  });
}
