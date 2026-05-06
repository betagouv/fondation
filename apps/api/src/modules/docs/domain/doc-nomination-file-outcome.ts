import { NominationFileOutcomeEnum } from 'src/modules/session/domain/nomination-file-outcome';
import { assertNever } from 'src/utils/assert-never';

export const DOC_NOMINATION_FILE_OUTCOME_ENUM = [
  'VALIDATED',
  'NON_VALIDATED',
  'SUSPENDED',
  'WITHDRAWN',
] as const;
export type DocNominationFileOutcomeEnum = (typeof DOC_NOMINATION_FILE_OUTCOME_ENUM)[number];

export function nominationFileOutcomeToDocNominationFileOutcome(
  value: NominationFileOutcomeEnum,
): DocNominationFileOutcomeEnum {
  switch (value) {
    case 'ASSESSING':
    case 'WAITING_DSJ':
    case 'REMOVED':
    case 'SUSPENDED':
      return 'SUSPENDED';

    case 'NON_VALIDATED':
      return 'NON_VALIDATED';

    case 'VALIDATED':
      return 'VALIDATED';

    case 'WITHDRAWN':
      return 'WITHDRAWN';

    default:
      return assertNever(value);
  }
}
