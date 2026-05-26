import { format } from 'date-fns';

import { Magistrat } from 'shared-models';

export function agendaFileName(file: {
  formation: 'SIEGE' | 'PARQUET' | Magistrat.Formation;
  date: Date;
}): string {
  return `Ordre du jour - ${file.formation === 'SIEGE' ? 'Siège' : 'Parquet'} ${format(file.date, 'dd-MM-yyyy')}.pdf`;
}
