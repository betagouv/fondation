import { formatDateOnly, type PlainDateOnly } from '@/utils/date-only.util';

export const transparencyToLabel = (transparency: string, dateTransparence: PlainDateOnly) => {
  return 'T ' + formatDateOnly(dateTransparence) + ` (${transparency})`;
};
