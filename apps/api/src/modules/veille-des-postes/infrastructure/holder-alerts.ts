import z from 'zod';

import {
  ALERT_DEADLINES,
  alertDeadlines,
  deadlinesOf,
  type HolderAlert,
  POSITION_ALERTS,
  positionAlerts,
} from '../domain/position-alert';
import { POSITION_STATUSES, positionStatuses } from '../domain/position-status';

import type { FacetValues } from './faceted-rows';

/** the deadline and the due date serve the filter and the sort, done here: the client only shows the labels */
export const holderAlertSchema = z.object({
  id: z.enum(POSITION_ALERTS),
  label: z.string(),
  shortLabel: z.string(),
});

export const statusAndAlertFacetsSchema = z.object({
  alerts: z.array(z.object({ count: z.number(), id: z.enum(POSITION_ALERTS), label: z.string() })),
  deadlines: z.array(z.object({ count: z.number(), id: z.enum(ALERT_DEADLINES), label: z.string() })),
  statuses: z.array(z.object({ count: z.number(), id: z.enum(POSITION_STATUSES), label: z.string() })),
});

type AssessedRow = { alerts: HolderAlert[]; status: { id: string } };

export type StatusAndAlertAsked = Record<'alert' | 'deadline' | 'status', readonly string[]>;

/** the alert and its deadline go together: "retirement within six months" leaves out a retirement in ten
 * months, even beside a proposal next month */
export function statusAndAlertValues<Row extends AssessedRow>(
  asked: StatusAndAlertAsked,
): FacetValues<Row, 'alert' | 'deadline' | 'status'> {
  const ofAskedDeadlines = (alert: HolderAlert) =>
    asked.deadline.length === 0 || deadlinesOf([alert]).some((deadline) => asked.deadline.includes(deadline));
  const ofAskedAlerts = (alert: HolderAlert) => asked.alert.length === 0 || asked.alert.includes(alert.id);
  return {
    alert: (row) => row.alerts.filter(ofAskedDeadlines).map(({ id }) => id),
    deadline: (row) => deadlinesOf(row.alerts.filter(ofAskedAlerts)),
    status: (row) => [row.status.id],
  };
}

export function countedStatusAndAlertFacets(
  counts: Record<'alert' | 'deadline' | 'status', Map<string, number>>,
): z.infer<typeof statusAndAlertFacetsSchema> {
  return {
    alerts: positionAlerts().map((alert) => ({ ...alert, count: counts.alert.get(alert.id) ?? 0 })),
    deadlines: alertDeadlines().map((deadline) => ({
      ...deadline,
      count: counts.deadline.get(deadline.id) ?? 0,
    })),
    statuses: positionStatuses().map((status) => ({ ...status, count: counts.status.get(status.id) ?? 0 })),
  };
}

/** by the earliest alert, the rows without one last whatever the direction */
export function sortedByAlert<Row extends AssessedRow>(rows: readonly Row[], desc: boolean): Row[] {
  const dueTime = (row: Row) => row.alerts[0]?.dueDate.toDate().getTime();
  return rows.toSorted((a, b) => {
    const [aTime, bTime] = [dueTime(a), dueTime(b)];
    if (aTime === undefined || bTime === undefined)
      return Number(aTime === undefined) - Number(bTime === undefined);
    return desc ? bTime - aTime : aTime - bTime;
  });
}

export function alertJson({ id, label, shortLabel }: HolderAlert): z.infer<typeof holderAlertSchema> {
  return { id, label, shortLabel };
}
