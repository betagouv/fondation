import { format } from 'date-fns';

import { FormationEnum } from 'src/modules/shared/formation.enum';

export function officialReportFileName(file: {
  formation: 'PARQUET' | 'SIEGE' | FormationEnum;
  date: Date;
}): string {
  return `PV - ${file.formation === 'SIEGE' ? 'Siège' : 'Parquet'} ${format(file.date, 'dd-MM-yyyy')}.pdf`;
}
