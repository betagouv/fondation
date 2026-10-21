import { format } from 'date-fns';

import { DateOnly } from '../../../../utils/date-only';
import { initials } from '../../../../utils/user.util';
import { FormationEnum } from '../../../shared/formation.enum';
import { TypeDeSaisineEnum, TypeDeSaisineEnumLabels } from '../../../shared/type-de-saisine.enum';

export function docFileName(file: {
  type: 'AGENDA' | 'OFFICIAL_REPORT' | 'PRESENTATION_PLAN';
  typeDeSaisine: TypeDeSaisineEnum;
  chairman: { firstName: string; lastName: string };
  sessionName: string | null;
  formation: 'SIEGE' | 'PARQUET' | FormationEnum | null;
  date: DateOnly;
}): string {
  const docType = file.type === 'AGENDA' ? 'ODJ' : file.type === 'OFFICIAL_REPORT' ? 'PV' : 'NDR';

  const date = format(file.date.toLocalStartOfDay(), 'dd-MM-yyyy');
  const formationLabel = file.formation ? (file.formation === 'SIEGE' ? 'Siège' : 'Parquet') : null;
  const firstLetters = initials(file.chairman);
  const typeDeSaisineLabel = TypeDeSaisineEnumLabels.TRANSPARENCE_GDS;
  const sessionName = file.sessionName
    ? file.typeDeSaisine === 'TRANSPARENCE_GDS'
      ? file.sessionName.replace(/^transparence\b/i, '').trim()
      : file.sessionName
    : null;

  return (
    [docType, date, sessionName ? `${typeDeSaisineLabel} ${sessionName}` : null, firstLetters, formationLabel]
      .filter(Boolean)
      .join(' - ') + '.pdf'
  );
}
