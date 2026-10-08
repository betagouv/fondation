import type { SessionOutcome } from '@/features/nomination-files-table/context/files-table.context';
import type { FormationEnum } from '@/shared/enums/formation.enum';

export function makeSessionOutcomes(formation: FormationEnum): SessionOutcome[] {
  const decisionLabels =
    formation === 'PARQUET'
      ? { NON_VALIDATED: 'avis défavorable', VALIDATED: 'avis favorable' }
      : { NON_VALIDATED: 'avis non conforme', VALIDATED: 'avis conforme' };

  return [
    { commentRequired: false, label: decisionLabels.VALIDATED, value: 'VALIDATED' },
    { commentRequired: true, label: decisionLabels.NON_VALIDATED, value: 'NON_VALIDATED' },
    { commentRequired: false, label: 'sursis à statuer', value: 'SUSPENDED' },
    { commentRequired: false, label: 'en attente complément DSJ', value: 'WAITING_DSJ' },
    { commentRequired: false, label: 'retrait (désistement)', value: 'WITHDRAWN' },
    { commentRequired: false, label: 'retrait', value: 'REMOVED' },
  ];
}
