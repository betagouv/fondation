import { FormationEnum } from 'src/modules/shared/formation.enum';
import {
  NominationFileOutcomeEnum,
  nominationFileOutcomeLabel,
} from 'src/modules/shared/nomination-file-outcome.enum';
import { assertNever } from 'src/utils/assert-never';

export const FINAL_DOC_NOMINATION_FILE_OUTCOMES = ['NON_VALIDATED', 'VALIDATED', 'WITHDRAWN'] as const;
export type FinalDocNominationFileOutcomeEnum = (typeof FINAL_DOC_NOMINATION_FILE_OUTCOMES)[number];

export const DOC_NOMINATION_FILE_OUTCOMES = [...FINAL_DOC_NOMINATION_FILE_OUTCOMES, 'SUSPENDED'] as const;
export type DocNominationFileOutcomeEnum = (typeof DOC_NOMINATION_FILE_OUTCOMES)[number];

export function isFinalDocNominationFileOutcome(
  outcome: DocNominationFileOutcomeEnum,
): outcome is FinalDocNominationFileOutcomeEnum {
  return (FINAL_DOC_NOMINATION_FILE_OUTCOMES as readonly DocNominationFileOutcomeEnum[]).includes(outcome);
}

export function nominationFileOutcomeToDocNominationFileOutcome(
  value: NominationFileOutcomeEnum,
): DocNominationFileOutcomeEnum {
  switch (value) {
    case 'WAITING_DSJ':
    case 'SUSPENDED':
      return 'SUSPENDED';

    case 'NON_VALIDATED':
      return 'NON_VALIDATED';

    case 'VALIDATED':
      return 'VALIDATED';

    case 'REMOVED':
    case 'WITHDRAWN':
      return 'WITHDRAWN';

    default:
      return assertNever(value);
  }
}

export function docNominationFileOutcomeLabel(props: {
  formation: FormationEnum;
  outcome: DocNominationFileOutcomeEnum;
}): string {
  switch (props.outcome) {
    case 'VALIDATED':
    case 'NON_VALIDATED':
      return nominationFileOutcomeLabel(props);

    case 'SUSPENDED':
      return 'sursis à statuer';

    case 'WITHDRAWN':
      return 'retrait';

    default:
      return assertNever(props.outcome);
  }
}
