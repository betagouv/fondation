import Badge from '@codegouvfr/react-dsfr/Badge';
import { useIntl } from 'react-intl';

import { IconButton } from '@/shared/ui/icon-button';
import { ACTION_ICONS } from '@/shared/ui/icons';
import { Tooltip } from '@/shared/ui/tooltip';
import type { HolderAlert, HolderStatus, PositionStatus } from '@queries/veille-des-postes.queries';

import { POSITION_VACANCY_SIDE_PANEL_ID } from './PositionVacancySidePanel';

const SEVERITIES: Record<PositionStatus, 'error' | 'info' | 'warning'> = {
  MAY_BECOME_VACANT: 'warning',
  OCCUPIED: 'info',
  VACANT: 'error',
};

export function PositionStatusBadge(props: { status: { id: PositionStatus; label: string } }) {
  return (
    <Badge
      // inline: a badge on two lines hugs each of them rather than keeping the width of the cell
      className="inline box-decoration-clone whitespace-normal"
      noIcon
      severity={SEVERITIES[props.status.id]}
      small
    >
      {props.status.label}
    </Badge>
  );
}

export function PositionStatusCell(props: {
  alerts: HolderAlert[];
  onEdit?: () => void;
  status: HolderStatus;
}) {
  const { formatMessage } = useIntl();

  // the badge wraps between its words only: the pencil follows its last word and never sits alone on a line
  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-col items-start gap-1">
        <div className="text-xs leading-5 whitespace-nowrap">
          <PositionStatusBadge status={props.status} />
          {props.onEdit && (
            <IconButton
              aria-controls={POSITION_VACANCY_SIDE_PANEL_ID}
              aria-haspopup="dialog"
              // taller than the badge: the line keeps the height of the badge. The middle of the text sits
              // higher than the middle of the badge
              className="-my-1.5 ml-1 translate-y-1 align-middle"
              iconId={ACTION_ICONS.edit}
              label={formatMessage({ defaultMessage: 'Modifier le statut' })}
              onClick={props.onEdit}
              small
            />
          )}
        </div>
        {props.status.detail &&
          (props.status.hint ? (
            <Tooltip align="start" focusable label={props.status.hint}>
              <span className="text-xs leading-5 text-(--text-default-grey)">{props.status.detail}</span>
            </Tooltip>
          ) : (
            <span className="text-xs leading-5 text-(--text-default-grey)">{props.status.detail}</span>
          ))}
      </div>
      {props.alerts.map((alert) => (
        <Tooltip align="start" focusable key={alert.id} label={alert.label}>
          <span className="text-xs leading-5 text-(--text-mention-grey)">{alert.shortLabel}</span>
        </Tooltip>
      ))}
    </div>
  );
}
