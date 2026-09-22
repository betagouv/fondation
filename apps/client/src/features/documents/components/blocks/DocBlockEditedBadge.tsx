import Badge from '@codegouvfr/react-dsfr/Badge';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { FormattedMessage, useIntl } from 'react-intl';

import { useUser } from '@queries/auth.queries';

type Writer = { id: string; name: string } | null;

export function DocBlockEditedBadge(props: {
  agendaEditedAt?: string | null;
  agendaEditedBy?: Writer;
  editedAt?: string | null;
  editedBy?: Writer;
  fromAgenda?: boolean;
}) {
  const { formatDate, formatTime } = useIntl();
  const { agendaEditedAt, agendaEditedBy, editedAt, editedBy, fromAgenda } = props;

  const when = (at: string) => ({
    date: formatDate(at, { format: 'zonedDayMonth' }),
    // French writes the time as 12h30, where Intl separates with a colon
    time: formatTime(at, { format: 'zonedTimeShort' }).replace(':', 'h'),
  });

  const writtenHere = Boolean(editedAt) && !fromAgenda;

  return (
    <span className="mb-2 flex flex-col items-start gap-1">
      {agendaEditedAt && (
        <DocBlockEditedLine tone="yellow" writer={agendaEditedBy}>
          <FormattedMessage
            defaultMessage="Cette section a été modifiée dans l'ordre du jour le {date} à {time}"
            values={when(agendaEditedAt)}
          />
        </DocBlockEditedLine>
      )}

      {writtenHere && (
        <DocBlockEditedLine tone={agendaEditedAt ? 'orange' : 'yellow'} writer={editedBy}>
          <FormattedMessage
            defaultMessage="Cette section a été modifiée le {date} à {time}"
            values={when(editedAt!)}
          />
        </DocBlockEditedLine>
      )}
    </span>
  );
}

function DocBlockEditedLine(props: {
  children: React.ReactNode;
  tone: 'orange' | 'yellow';
  writer?: Writer;
}) {
  const { user } = useUser();
  const { children, tone, writer } = props;

  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <Badge
        className={clsx(
          'fr-mb-0 text-(--text-default-grey) before:content-[""]',
          tone === 'yellow'
            ? 'bg-(--background-contrast-yellow-tournesol)'
            : 'bg-(--background-contrast-orange-terre-battue)',
          cx('ri-pen-nib-fill'),
        )}
        noIcon
        small
      >
        {!writer ? (
          <FormattedMessage defaultMessage="modifié" />
        ) : writer.id === user?.id ? (
          <FormattedMessage defaultMessage="modifié par vous" />
        ) : (
          <FormattedMessage defaultMessage="modifié par {writer}" values={{ writer: writer.name }} />
        )}
      </Badge>
      <span className="fr-text--sm fr-mb-0 text-(--text-mention-grey)">{children}</span>
    </span>
  );
}
