import Badge from '@codegouvfr/react-dsfr/Badge';

import { Tooltip } from '@/shared/ui/tooltip';
import type { HolderAlert, PositionStatus } from '@queries/veille-des-postes.queries';

const SEVERITIES: Record<PositionStatus, 'error' | 'info' | 'warning'> = {
  MAY_BECOME_VACANT: 'warning',
  OCCUPIED: 'info',
  VACANT: 'error',
};

export function PositionStatusCell(props: {
  alerts: HolderAlert[];
  status: { id: PositionStatus; label: string };
}) {
  return (
    <div className="flex flex-col items-start gap-2">
      <Badge noIcon severity={SEVERITIES[props.status.id]} small>
        {props.status.label}
      </Badge>
      {props.alerts.map((alert) => (
        <Tooltip focusable key={alert.id} label={alert.label}>
          <span className="text-xs leading-5 text-(--text-mention-grey)">{alert.shortLabel}</span>
        </Tooltip>
      ))}
    </div>
  );
}
