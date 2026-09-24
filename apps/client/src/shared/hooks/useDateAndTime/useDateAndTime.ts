import { useIntl } from 'react-intl';

import { toFrenchHours } from '@/utils/time-only.util';

export function useDateAndTime() {
  const { formatDate, formatTime } = useIntl();

  return (at: string) => ({
    date: formatDate(at, { format: 'zonedDateShort' }),
    time: toFrenchHours(formatTime(at, { format: 'zonedTimeShort' })),
  });
}
