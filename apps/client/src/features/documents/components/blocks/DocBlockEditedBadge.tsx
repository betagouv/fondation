import Badge from '@codegouvfr/react-dsfr/Badge';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { FormattedMessage, useIntl } from 'react-intl';

/** a text written in the agenda and carried over reads the same, but the report did not write it */
export function DocBlockEditedBadge(props: { editedAt?: string | null; fromAgenda?: boolean }) {
  const { formatDate, formatTime } = useIntl();
  const { editedAt, fromAgenda } = props;

  const when = (at: string) => ({
    date: formatDate(at, { format: 'zonedDayMonth' }),
    // French writes the time as 12h30, where Intl separates with a colon
    time: formatTime(at, { format: 'zonedTimeShort' }).replace(':', 'h'),
  });

  return (
    <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <Badge
        className={clsx(
          'bg-(--background-contrast-yellow-tournesol) text-(--text-default-grey) before:content-[""]',
          cx('ri-pen-nib-fill'),
        )}
        noIcon
        small
      >
        {fromAgenda ? (
          <FormattedMessage defaultMessage="modifié dans l'ordre du jour" />
        ) : (
          <FormattedMessage defaultMessage="modifié par vous" />
        )}
      </Badge>
      {editedAt && (
        <span className="fr-text--sm fr-mb-0 text-(--text-mention-grey)">
          {fromAgenda ? (
            <FormattedMessage
              defaultMessage="Cette section a été modifiée dans l'ordre du jour le {date} à {time}."
              values={when(editedAt)}
            />
          ) : (
            <FormattedMessage
              defaultMessage="Vous avez édité cette section le {date} à {time}."
              values={when(editedAt)}
            />
          )}
        </span>
      )}
    </span>
  );
}
