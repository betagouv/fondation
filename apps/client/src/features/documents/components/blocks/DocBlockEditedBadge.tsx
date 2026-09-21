import Badge from '@codegouvfr/react-dsfr/Badge';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { FormattedMessage, useIntl } from 'react-intl';

export function DocBlockEditedBadge(props: { editedAt?: string | null }) {
  const { formatDate, formatTime } = useIntl();
  const { editedAt } = props;

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
        <FormattedMessage defaultMessage="modifié par vous" />
      </Badge>
      {editedAt && (
        <span className="fr-text--sm fr-mb-0 text-(--text-mention-grey)">
          <FormattedMessage
            defaultMessage="Vous avez édité cette section le {date} à {time}."
            values={{
              date: formatDate(editedAt, { format: 'zonedDayMonth' }),
              // French writes the time as 12h30, where Intl separates with a colon
              time: formatTime(editedAt, { format: 'zonedTimeShort' }).replace(':', 'h'),
            }}
          />
        </span>
      )}
    </span>
  );
}
