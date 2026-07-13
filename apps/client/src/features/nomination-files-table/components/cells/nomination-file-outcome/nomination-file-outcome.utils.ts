import type { SessionOutcome } from '@/features/nomination-files-table/context/files-table.context';
import type { NominationFileOutcomeEnum } from '@/types/enums.types';

export function outcomeRequiresComment(
  outcomes: readonly SessionOutcome[],
  outcome: NominationFileOutcomeEnum | null,
): boolean {
  return outcomes.some(({ value, commentRequired }) => value === outcome && commentRequired);
}

export function sessionOutcomeLabel(
  outcomes: readonly SessionOutcome[],
  outcome: NominationFileOutcomeEnum,
): string | undefined {
  return outcomes.find(({ value }) => value === outcome)?.label;
}
