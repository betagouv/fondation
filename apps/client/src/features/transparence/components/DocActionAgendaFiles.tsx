import Button from '@codegouvfr/react-dsfr/Button';
import { useIntl } from 'react-intl';
import { generatePath } from 'react-router';

import { ROUTE_PATHS } from '@/utils/route-path.utils';

export function DocActionAgendaFiles(props: {
  sessionId: string;
  agendaId: string;
  name: string;
  disabled: boolean;
}) {
  const { formatMessage } = useIntl();
  const title = formatMessage({ defaultMessage: `Modifier les propositions` }, { name: props.name });

  return (
    <Button
      // issue with Button typing
      disabled={props.disabled as never}

      size="small"
      iconId="ri-file-copy-2-line"
      priority="tertiary no outline"
      className="rounded-full"
      title={title}
      linkProps={{
        to: generatePath(ROUTE_PATHS.SG.AGENDA_UPDATE_FILES, {
          sessionId: props.sessionId,
          agendaId: props.agendaId,
        }),
      }}
    />
  );
}
