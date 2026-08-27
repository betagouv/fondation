import type { AlertProps } from '@codegouvfr/react-dsfr/Alert';
import { useMemo } from 'react';

import { type FormationEnum, NominationFileOutcomeEnum } from '@/types/enums.types';

const OUTCOME_BADGE_LABELS = {
  PARQUET: {
    VALIDATED: 'favorable',
    NON_VALIDATED: 'défavorable',
    SUSPENDED: 'sursis',
    REMOVED: 'retrait',
    WITHDRAWN: 'désistement',
    ASSESSING: 'évaluation',
    WAITING_DSJ: 'complément DSJ',
  },
  SIEGE: {
    VALIDATED: 'conforme',
    NON_VALIDATED: 'non conforme',
    SUSPENDED: 'sursis',
    REMOVED: 'retrait',
    WITHDRAWN: 'désistement',
    ASSESSING: 'évaluation',
    WAITING_DSJ: 'complément DSJ',
  },
} as const satisfies Record<FormationEnum, Record<NominationFileOutcomeEnum, string>>;

const OUTCOME_BADGE_ACRONYM = {
  PARQUET: {
    VALIDATED: 'AF',
    NON_VALIDATED: 'AD',
    SUSPENDED: 'SAS',
    REMOVED: 'R',
    WITHDRAWN: 'RD',
    ASSESSING: 'EVL',
    WAITING_DSJ: 'DSJ',
  },
  SIEGE: {
    VALIDATED: 'AC',
    NON_VALIDATED: 'ANC',
    SUSPENDED: 'SAS',
    REMOVED: 'R',
    WITHDRAWN: 'RD',
    ASSESSING: 'EVL',
    WAITING_DSJ: 'DSJ',
  },
} as const satisfies Record<FormationEnum, Record<NominationFileOutcomeEnum, string>>;

const OUTCOME_BADGE_SEVERITY = {
  VALIDATED: 'success',
  NON_VALIDATED: 'error',
  SUSPENDED: 'info',
  REMOVED: 'warning',
  WITHDRAWN: undefined,
  ASSESSING: 'info',
  WAITING_DSJ: 'info',
} as const satisfies Record<NominationFileOutcomeEnum, AlertProps.Severity | undefined>;

export const useOutcomeBadge = (outcome: {
  formation: FormationEnum;
  outcome: NominationFileOutcomeEnum | null;
}) =>
  useMemo(
    () =>
      outcome.outcome === null
        ? {
            badge: '',
            acronym: '',
            severity: undefined,
          }
        : {
            badge: OUTCOME_BADGE_LABELS[outcome.formation][outcome.outcome],
            acronym: OUTCOME_BADGE_ACRONYM[outcome.formation][outcome.outcome],
            severity: OUTCOME_BADGE_SEVERITY[outcome.outcome],
          },
    [outcome],
  );
