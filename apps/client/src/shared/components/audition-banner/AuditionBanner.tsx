import clsx from 'clsx';
import type { ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { PlainDateOnly } from '@/utils/date-only.util';
import type { PlainTimeOnly } from '@/utils/time-only.util';

export function AuditionBanner(props: {
  children?: ReactNode;
  className?: string;
  date: PlainDateOnly | null;
  time: PlainTimeOnly | null;
}) {
  const { formatDate, formatTime } = useIntl();

  if (!props.date || !props.time) return null;

  const scheduledAt = new Date(
    props.date.year,
    props.date.month - 1,
    props.date.day,
    props.time.hours,
    props.time.minutes,
    props.time.seconds,
  );
  const isPast = scheduledAt.getTime() < Date.now();
  const values = {
    date: formatDate(scheduledAt, { format: 'dateOnlyShort' }),
    time: formatTime(scheduledAt, { format: 'timeOnlyShort' }),
  };

  return (
    <div
      className={clsx(
        'flex items-center gap-3 bg-(--background-contrast-info) font-medium text-(--text-default-info)',
        props.className,
      )}
    >
      <span aria-hidden className="fr-icon-info-fill shrink-0" />
      <span>
        {isPast ? (
          <FormattedMessage defaultMessage="Une audition a eu lieu le {date} à {time}" values={values} />
        ) : (
          <FormattedMessage defaultMessage="Une audition est prévue le {date} à {time}" values={values} />
        )}
      </span>
      {props.children}
    </div>
  );
}
