import type { AlertProps } from '@codegouvfr/react-dsfr/Alert';

import type { FormationEnum } from '@/shared/enums/formation.enum';
import type { NominationFileOutcomeEnum } from '@/shared/enums/nomination-file-outcome.enum';

const OUTCOME_BADGE_LABELS = {
  PARQUET: {
    NON_VALIDATED: 'défavorable',
    REMOVED: 'retrait',
    SUSPENDED: 'sursis',
    VALIDATED: 'favorable',
    WAITING_DSJ: 'complément DSJ',
    WITHDRAWN: 'désistement',
  },
  SIEGE: {
    NON_VALIDATED: 'non conforme',
    REMOVED: 'retrait',
    SUSPENDED: 'sursis',
    VALIDATED: 'conforme',
    WAITING_DSJ: 'complément DSJ',
    WITHDRAWN: 'désistement',
  },
} as const satisfies Record<FormationEnum, Record<NominationFileOutcomeEnum, string>>;

const OUTCOME_BADGE_ACRONYM = {
  PARQUET: {
    NON_VALIDATED: 'AD',
    REMOVED: 'R',
    SUSPENDED: 'SAS',
    VALIDATED: 'AF',
    WAITING_DSJ: 'DSJ',
    WITHDRAWN: 'RD',
  },
  SIEGE: {
    NON_VALIDATED: 'ANC',
    REMOVED: 'R',
    SUSPENDED: 'SAS',
    VALIDATED: 'AC',
    WAITING_DSJ: 'DSJ',
    WITHDRAWN: 'RD',
  },
} as const satisfies Record<FormationEnum, Record<NominationFileOutcomeEnum, string>>;

const OUTCOME_BADGE_SEVERITY = {
  NON_VALIDATED: 'error',
  REMOVED: 'warning',
  SUSPENDED: 'info',
  VALIDATED: 'success',
  WAITING_DSJ: 'info',
  WITHDRAWN: undefined,
} as const satisfies Record<NominationFileOutcomeEnum, AlertProps.Severity | undefined>;

export function outcomeBadge(props: { formation: FormationEnum; outcome: NominationFileOutcomeEnum }) {
  return {
    acronym: OUTCOME_BADGE_ACRONYM[props.formation][props.outcome],
    badge: OUTCOME_BADGE_LABELS[props.formation][props.outcome],
    severity: OUTCOME_BADGE_SEVERITY[props.outcome],
  };
}
