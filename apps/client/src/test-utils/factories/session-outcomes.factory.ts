import type { SessionOutcome } from '@/features/nomination-files-table/context/files-table.context';
import type { FormationEnum } from '@/types/enums.types';

export function makeSessionOutcomes(formation: FormationEnum): SessionOutcome[] {
  const decisionLabels =
    formation === 'PARQUET'
      ? { VALIDATED: 'avis favorable', NON_VALIDATED: 'avis défavorable' }
      : { VALIDATED: 'avis conforme', NON_VALIDATED: 'avis non conforme' };

  return [
    { value: 'VALIDATED', label: decisionLabels.VALIDATED, commentRequired: false },
    { value: 'NON_VALIDATED', label: decisionLabels.NON_VALIDATED, commentRequired: true },
    { value: 'SUSPENDED', label: 'sursis à statuer', commentRequired: false },
    { value: 'WAITING_DSJ', label: 'en attente complément DSJ', commentRequired: false },
    { value: 'ASSESSING', label: 'en attente évaluation', commentRequired: false },
    { value: 'WITHDRAWN', label: 'retrait (désistement)', commentRequired: false },
    { value: 'REMOVED', label: 'retrait', commentRequired: false },
  ];
}
