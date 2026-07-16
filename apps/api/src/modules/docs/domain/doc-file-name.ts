import { format } from 'date-fns';

import { TypeDeSaisine, TypeDeSaisineLabels } from 'shared-models';

import { FormationEnum } from 'src/modules/shared/formation.enum';
import { initials } from 'src/utils/user.util';

export function docFileName(file: {
  type: 'AGENDA' | 'OFFICIAL_REPORT' | 'PRESENTATION_PLAN';
  typeDeSaisine: TypeDeSaisine;
  chairman: { firstName: string; lastName: string };
  sessionName: string | null;
  formation: 'SIEGE' | 'PARQUET' | FormationEnum | null;
  date: Date;
}): string {
  const docType = file.type === 'AGENDA' ? 'ODJ' : file.type === 'OFFICIAL_REPORT' ? 'PV' : 'NDR';

  const date = format(file.date, 'dd-MM-yyyy');
  const formationLabel = file.formation ? (file.formation === 'SIEGE' ? 'Siège' : 'Parquet') : null;
  const firstLetters = initials(file.chairman);
  const typeDeSaisineLabel = TypeDeSaisineLabels.TRANSPARENCE_GDS;
  const sessionName = file.sessionName
    ? file.typeDeSaisine === TypeDeSaisine.TRANSPARENCE_GDS
      ? file.sessionName.replace(/^transparence\b/i, '').trim()
      : file.sessionName
    : null;

  return (
    [docType, date, sessionName ? `${typeDeSaisineLabel} ${sessionName}` : null, firstLetters, formationLabel]
      .filter(Boolean)
      .join(' - ') + '.pdf'
  );
}
