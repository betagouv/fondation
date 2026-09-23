import { useIntl } from 'react-intl';

import { toFrenchHours } from '@/utils/time-only.util';

export function useWhen() {
  const { formatDate, formatTime } = useIntl();

  return (at: string) => ({
    date: formatDate(at, { format: 'zonedDayMonth' }),
    time: toFrenchHours(formatTime(at, { format: 'zonedTimeShort' })),
  });
}
