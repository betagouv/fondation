import { format } from 'date-fns';

import type { DateOnly } from './date-only';

export function frenchDate(date: DateOnly): string {
  return format(date.toLocalStartOfDay(), 'dd/MM/yyyy');
}
