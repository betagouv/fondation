import clsx from 'clsx';
import { FormattedMessage, useIntl } from 'react-intl';

import type { DetailedHelpPageDto } from '@api/types';
import { useUser } from '@queries/auth.queries';

export function HelpPageUpdate(props: { className?: string; helpPage: DetailedHelpPageDto }) {
  const { formatDate, formatTime } = useIntl();
  const { user } = useUser();
  const { updatedAt, updatedBy } = props.helpPage;

  if (!updatedBy) return null;

  return (
    <p className={clsx('fr-hint-text fr-mb-0', props.className)}>
      <FormattedMessage
        defaultMessage="Mise à jour le {date} à {time}{who, select, self { par vous} other { par {name}}}"
        values={{
          date: formatDate(updatedAt, { format: 'zonedDateShort' }),
          name: updatedBy.name,
          time: formatTime(updatedAt, { format: 'zonedTimeShort' }),
          who: updatedBy.id === user?.id ? 'self' : 'someone',
        }}
      />
    </p>
  );
}
