import Button from '@codegouvfr/react-dsfr/Button';
import { useIntl } from 'react-intl';
import { generatePath } from 'react-router';

import { ROUTE_PATHS } from '@/utils/route-path.utils';

export function DocActionAgendaMetadata(props: {
  sessionId: string;
  agendaId: string;
  name: string;
  disabled: boolean;
}) {
  const { formatMessage } = useIntl();
  return (
    <Button
      size="small"
      iconId="ri-calendar-event-line"
      priority="tertiary no outline"
      className="rounded-full"
      title={formatMessage({ defaultMessage: `Modifier les métadonnées` })}
      linkProps={{
        to: generatePath(ROUTE_PATHS.SG.AGENDA_UPDATE_METADATA, {
          sessionId: props.sessionId,
          agendaId: props.agendaId,
        }),
      }}

      // issue with <Button /> typings
      disabled={props.disabled as never}
    />
  );
}
