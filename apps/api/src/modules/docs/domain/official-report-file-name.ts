import { format } from 'date-fns';

import { Magistrat } from 'shared-models';

export function officialReportFileName(file: {
  formation: 'PARQUET' | 'SIEGE' | Magistrat.Formation;
  date: Date;
}): string {
  return `PV - ${file.formation === 'SIEGE' ? 'Siège' : 'Parquet'} ${format(file.date, 'dd-MM-yyyy')}.pdf`;
}
