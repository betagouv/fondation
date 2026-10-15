import { FormattedMessage } from 'react-intl';

import { formatDateOnly, type PlainDateOnly } from '@/utils/date-only.util';
import { inFrenchHours, type PlainTimeOnly } from '@/utils/time-only.util';

/**
 * a restitution is dated by its notice and its ending time rather than by the click, which may come later;
 * the two make no instant, so neither goes through a time zone
 */
export function PresentationMoment(props: { date: PlainDateOnly; endTime: PlainTimeOnly | null }) {
  const date = formatDateOnly(props.date);
  const time = props.endTime && inFrenchHours(props.endTime);

  return (
    <span className="whitespace-nowrap">
      {time ? <FormattedMessage defaultMessage="{date} à {time}" values={{ date, time }} /> : date}
    </span>
  );
}
