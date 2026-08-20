import { useIntl } from 'react-intl';
import { generatePath } from 'react-router';

import { ACTION_ICONS } from '@/constants/icons.constants';
import { IconLink } from '@/shared/ui/icon-button';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

export function DocActionAgendaMetadata(props: {
  agendaId: string;
  disabled: boolean;
  name: string;
  sessionId: string;
}) {
  const { formatMessage } = useIntl();

  return (
    <IconLink
      disabled={props.disabled}
      iconId={ACTION_ICONS.agendaMetadata}
      label={formatMessage({ defaultMessage: 'Modifier les métadonnées de {name}' }, { name: props.name })}
      to={generatePath(ROUTE_PATHS.SG.AGENDA_UPDATE_METADATA, {
        agendaId: props.agendaId,
        sessionId: props.sessionId,
      })}
    />
  );
}
