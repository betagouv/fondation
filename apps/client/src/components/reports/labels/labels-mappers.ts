import { format } from 'date-fns';

import { dateOnlyToDate, type PlainDateOnly } from '@/utils/date-only.util';

export const transparencyToLabel = (transparency: string, dateTransparence: PlainDateOnly) => {
  return 'T ' + format(dateOnlyToDate(dateTransparence), 'dd/MM/yyyy') + ` (${transparency})`;
};
