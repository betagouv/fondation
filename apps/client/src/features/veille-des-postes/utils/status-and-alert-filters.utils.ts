import type { IntlShape } from 'react-intl';

import type { TableMetaFilterEnum } from '@/shared/ui/data-table';
import type {
  AlertDeadlineCount,
  PositionAlertCount,
  PositionStatusCount,
} from '@queries/veille-des-postes.queries';

export type StatusAndAlertCounts = {
  alerts: PositionAlertCount[];
  deadlines: AlertDeadlineCount[];
  statuses: PositionStatusCount[];
};

export const NO_STATUS_AND_ALERT_COUNTS: StatusAndAlertCounts = { alerts: [], deadlines: [], statuses: [] };

/** the deadline comes last: it narrows the alerts asked */
export function statusAndAlertFilters(
  formatMessage: IntlShape['formatMessage'],
  counts: StatusAndAlertCounts,
): TableMetaFilterEnum[] {
  const counted = (values: { count: number; id: string; label: string }[]) =>
    values.map(({ count, id, label }) => ({
      id,
      label: formatMessage({ defaultMessage: '{label} ({count})' }, { count, label }),
    }));

  return [
    {
      filterId: 'alert',
      label: formatMessage({ defaultMessage: 'Alerte' }),
      type: 'enum',
      values: counted(counts.alerts),
    },
    {
      filterId: 'status',
      label: formatMessage({ defaultMessage: 'Statut' }),
      type: 'enum',
      values: counted(counts.statuses),
    },
    {
      filterId: 'deadline',
      label: formatMessage({ defaultMessage: 'Échéance' }),
      type: 'enum',
      values: counted(counts.deadlines),
    },
  ];
}
