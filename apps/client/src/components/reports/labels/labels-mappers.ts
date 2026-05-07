import { DateOnly, type PlainDateOnly } from '@/models/date-only.model';

export const transparencyToLabel = (transparency: string, dateTransparence: PlainDateOnly) => {
  return 'T ' + DateOnly.fromStoreModel(dateTransparence).toFormattedString() + ` (${transparency})`;
};
