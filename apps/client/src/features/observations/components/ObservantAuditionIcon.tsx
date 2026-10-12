import { useIntl } from 'react-intl';

import { Tooltip } from '@/shared/ui/tooltip';
import type { PlainDateOnly } from '@/utils/date-only.util';
import { isPastSchedule, toScheduledDate, type PlainTimeOnly } from '@/utils/time-only.util';

export function ObservantAuditionIcon(props: {
  audition: { date: PlainDateOnly; time: PlainTimeOnly } | null;
}) {
  const { formatDate, formatMessage, formatTime } = useIntl();
  if (!props.audition) return null;

  const scheduledAt = toScheduledDate(props.audition.date, props.audition.time);
  if (!scheduledAt) return null;

  const values = {
    date: formatDate(scheduledAt, { format: 'zonedDateShort' }),
    time: formatTime(scheduledAt, { format: 'zonedTimeShort' }),
  };
  const label = isPastSchedule(props.audition.date, props.audition.time)
    ? formatMessage({ defaultMessage: "L'observant a été auditionné le {date} à {time}" }, values)
    : formatMessage({ defaultMessage: "L'observant sera auditionné le {date} à {time}" }, values);

  return (
    <Tooltip label={label}>
      <i
        aria-label={label}
        className="fr-icon-speak-line fr-icon--sm fr-ml-1v text-(--text-action-high-blue-france)"
        role="img"
      />
    </Tooltip>
  );
}
