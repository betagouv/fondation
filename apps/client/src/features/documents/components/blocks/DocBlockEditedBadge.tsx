import Badge from '@codegouvfr/react-dsfr/Badge';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { useDateAndTime } from '@/shared/hooks/useDateAndTime';
import { useUser } from '@queries/auth.queries';

type Writer = { id: string; name: string } | null;

export type DocBlockPlace = 'agenda' | 'officialReport';

export function DocBlockEditedBadge(props: {
  agendaEditedAt?: string | null;
  agendaEditedBy?: Writer;
  editedAt?: string | null;
  editedBy?: Writer;
  fromAgenda?: boolean;
  place: DocBlockPlace;
}) {
  const { agendaEditedAt, agendaEditedBy, editedAt, editedBy, fromAgenda, place } = props;

  const writtenHere = Boolean(editedAt) && !fromAgenda;

  return (
    <span className="mb-3 flex flex-col items-start gap-1">
      {agendaEditedAt && (
        <DocBlockEditedLine
          at={agendaEditedAt}
          label={<FormattedMessage defaultMessage="modifié dans l'ODJ" />}
          tone="yellow"
          writer={agendaEditedBy}
        />
      )}

      {writtenHere && (
        <DocBlockEditedLine
          at={editedAt!}
          label={
            place === 'agenda' ? (
              <FormattedMessage defaultMessage="modifié" />
            ) : (
              <FormattedMessage defaultMessage="modifié dans le PV" />
            )
          }
          tone={agendaEditedAt ? 'orange' : 'yellow'}
          writer={editedBy}
        />
      )}
    </span>
  );
}

const TONES = {
  orange: 'bg-(--background-contrast-orange-terre-battue)',
  yellow: 'bg-(--background-contrast-yellow-tournesol)',
};

function DocBlockEditedLine(props: {
  at: string;
  label: NonNullable<ReactNode>;
  tone: keyof typeof TONES;
  writer?: Writer;
}) {
  const dateAndTime = useDateAndTime();
  const { user } = useUser();
  const { at, label, tone, writer } = props;

  const who = !writer ? 'nobody' : writer.id === user?.id ? 'self' : 'someone';

  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      <Badge
        className={clsx(
          'fr-mb-0 text-(--text-default-grey) before:content-[""]',
          TONES[tone],
          cx('ri-pen-nib-fill'),
        )}
        noIcon
        small
      >
        {label}
      </Badge>
      <span className="fr-text--sm fr-mb-0 text-(--text-mention-grey)">
        <FormattedMessage
          defaultMessage="{who, select, self {le {date} à {time} par vous} someone {le {date} à {time} par {writer}} other {le {date} à {time}}}"
          values={{ ...dateAndTime(at), who, writer: writer?.name }}
        />
      </span>
    </span>
  );
}
