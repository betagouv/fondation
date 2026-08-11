import type { ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { AlertBanner } from '@/shared/ui/alert-banner';
import type { PlainDateOnly } from '@/utils/date-only.util';
import { isPastSchedule, toScheduledDate, type PlainTimeOnly } from '@/utils/time-only.util';

export function AuditionScheduledBanner(props: {
  children?: ReactNode;
  className?: string;
  date: PlainDateOnly | null;
  time: PlainTimeOnly | null;
}) {
  const { formatDate, formatTime } = useIntl();

  const scheduledAt = toScheduledDate(props.date, props.time);
  if (!scheduledAt) return null;

  const values = {
    date: formatDate(scheduledAt, { format: 'dateOnlyShort' }),
    time: formatTime(scheduledAt, { format: 'timeOnlyShort' }),
  };

  return (
    <AlertBanner
      className={props.className}
      icon="fr-icon-speak-fill"
      message={
        isPastSchedule(props.date, props.time) ? (
          <FormattedMessage defaultMessage="Une audition a eu lieu le {date} à {time}" values={values} />
        ) : (
          <FormattedMessage defaultMessage="Une audition est prévue le {date} à {time}" values={values} />
        )
      }
      tone="info"
    >
      {props.children}
    </AlertBanner>
  );
}
