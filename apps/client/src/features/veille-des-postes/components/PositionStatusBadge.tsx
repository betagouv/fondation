import Badge from '@codegouvfr/react-dsfr/Badge';

import type { PositionStatus } from '@queries/veille-des-postes.queries';

const SEVERITIES: Record<PositionStatus, 'error' | 'info' | 'warning'> = {
  MAY_BECOME_VACANT: 'warning',
  OCCUPIED: 'info',
  VACANT: 'error',
};

export function PositionStatusBadge(props: { status: { id: PositionStatus; label: string } }) {
  return (
    <Badge noIcon severity={SEVERITIES[props.status.id]} small>
      {props.status.label}
    </Badge>
  );
}
