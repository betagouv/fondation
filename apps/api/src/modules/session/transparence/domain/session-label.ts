import { format } from 'date-fns';

import { DateOnly } from 'src/utils/date-only';

export function sessionLabel(session: { date: DateOnly; name: string }): string {
  return `T ${format(session.date.toLocalStartOfDay(), 'dd/MM/yyyy')} (${session.name})`;
}
