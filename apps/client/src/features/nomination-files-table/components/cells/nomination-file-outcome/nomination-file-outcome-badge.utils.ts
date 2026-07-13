import type { AlertProps } from '@codegouvfr/react-dsfr/Alert';
import { useMemo } from 'react';

import { type FormationEnum, NominationFileOutcomeEnum } from '@/types/enums.types';
import type { IconClassName } from '@/types/icons.types';

const NOMINATION_FILE_OUTCOME_BADGE_LABELS = {
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

const NOMINATION_FILE_OUTCOME_ACRONYM = {
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

const NOMINATION_FILE_OUTCOME_ICON = {
  VALIDATED: 'fr-icon-success-fill',
  NON_VALIDATED: 'fr-icon-error-fill',
  SUSPENDED: 'ri-timer-fill',
  REMOVED: 'fr-icon-warning-fill',
  WITHDRAWN: undefined,
  ASSESSING: 'ri-timer-fill',
  WAITING_DSJ: 'ri-timer-fill',
} as const satisfies Record<NominationFileOutcomeEnum, IconClassName | undefined>;

const NOMINATION_FILE_OUTCOME_SEVERITY = {
  VALIDATED: 'success',
  NON_VALIDATED: 'error',
  SUSPENDED: 'info',
  REMOVED: 'warning',
  WITHDRAWN: undefined,
  ASSESSING: 'info',
  WAITING_DSJ: 'info',
} as const satisfies Record<NominationFileOutcomeEnum, AlertProps.Severity | undefined>;

export const useNominationFileOutcome = (outcome: {
  formation: FormationEnum;
  outcome: NominationFileOutcomeEnum | null;
}) =>
  useMemo(
    () =>
      outcome.outcome === null
        ? {
            badge: '',
            acronym: '',
            icon: undefined,
            severity: undefined,
          }
        : {
            badge: NOMINATION_FILE_OUTCOME_BADGE_LABELS[outcome.formation][outcome.outcome],
            acronym: NOMINATION_FILE_OUTCOME_ACRONYM[outcome.formation][outcome.outcome],
            icon: NOMINATION_FILE_OUTCOME_ICON[outcome.outcome],
            severity: NOMINATION_FILE_OUTCOME_SEVERITY[outcome.outcome],
          },
    [outcome],
  );
