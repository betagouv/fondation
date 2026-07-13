import clsx from 'clsx';
import type { ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { PlainDateOnly } from '@/utils/date-only.util';
import { isPastSchedule, toScheduledDate, type PlainTimeOnly } from '@/utils/time-only.util';

export function AuditionBanner(props: {
  children?: ReactNode;
  className?: string;
  date: PlainDateOnly | null;
  time: PlainTimeOnly | null;
}) {
  const { formatDate, formatTime } = useIntl();

  const scheduledAt = toScheduledDate(props.date, props.time);
  if (!scheduledAt) return null;

  const isPast = isPastSchedule(props.date, props.time);
  const values = {
    date: formatDate(scheduledAt, { format: 'dateOnlyShort' }),
    time: formatTime(scheduledAt, { format: 'timeOnlyShort' }),
  };

  return (
    <div
      className={clsx(
        'flex items-center gap-2 bg-(--background-contrast-info) text-sm-plus font-medium text-(--text-default-info)',
        props.className,
      )}
    >
      <span aria-hidden className="fr-icon-info-fill shrink-0 before:[--icon-size:1.25rem]" />
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
