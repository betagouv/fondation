import { colors } from '@codegouvfr/react-dsfr';

import { DateOnly } from '@/models/date-only.model';
import type { DetailedNominationSessionDto } from '@api/types';

const Label = ({ nom }: { nom: string }) => (
  <div className="text-xs" style={{ color: colors.decisions.text.disabled.grey.default }}>
    {nom}
  </div>
);

export const TableauDeBordResumeDetails = (transparence: DetailedNominationSessionDto) => {
  const { dueDate, observationsClosingDate, positionStartDate } = transparence;

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      <div>
        <Label nom="Délai d'observation" />
        <div className="text-sm lining-nums">{DateOnly.fromDateOnly(observationsClosingDate)}</div>
      </div>
      <div>
        <Label nom="Date d'écheance" />
        <div className="text-sm lining-nums">{dueDate ? DateOnly.fromDateOnly(dueDate) : '-'}</div>
      </div>
      <div>
        <Label nom="Date de prise de poste" />
        <div className="text-sm lining-nums">
          {positionStartDate ? DateOnly.fromDateOnly(positionStartDate, 'dd/MM/yyyy') : '-'}
        </div>
      </div>
    </div>
  );
};
