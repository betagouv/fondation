import type { PaginatedNominationFiles } from '@api/types';

export type NominationFileOutcomeEnum = NonNullable<
  PaginatedNominationFiles['items'][number]['content']['outcome']
>['value'];

export const NominationFileOutcomeEnum = {
  ASSESSING: 'ASSESSING',
  NON_VALIDATED: 'NON_VALIDATED',
  REMOVED: 'REMOVED',
  SUSPENDED: 'SUSPENDED',
  VALIDATED: 'VALIDATED',
  WAITING_DSJ: 'WAITING_DSJ',
  WITHDRAWN: 'WITHDRAWN',
} as const satisfies Record<NominationFileOutcomeEnum, NominationFileOutcomeEnum>;
