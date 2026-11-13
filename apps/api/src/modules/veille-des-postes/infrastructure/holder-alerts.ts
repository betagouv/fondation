import z from 'zod';

import {
  ALERT_DEADLINES,
  alertDeadlines,
  type HolderAlert,
  POSITION_ALERTS,
  positionAlerts,
} from '../domain/position-alert';
import { POSITION_STATUSES, positionStatuses } from '../domain/position-status';
import { alertFacetValues } from '../domain/position-urgency';

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

export function statusAndAlertValues<Row extends AssessedRow>(
  asked: Record<'alert' | 'deadline' | 'status', readonly string[]>,
): FacetValues<Row, 'alert' | 'deadline' | 'status'> {
  const alertValues = alertFacetValues(asked);
  return {
    alert: (row) => alertValues.alert(row.alerts),
    deadline: (row) => alertValues.deadline(row.alerts),
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

export function alertJson({ id, label, shortLabel }: HolderAlert): z.infer<typeof holderAlertSchema> {
  return { id, label, shortLabel };
}
