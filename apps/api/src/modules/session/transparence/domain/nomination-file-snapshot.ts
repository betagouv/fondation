import { NominationFileOutcomeEnum } from 'src/modules/shared/nomination-file-outcome.enum';

export type NominationFileSnapshot = {
  id: string;
  outcome: NominationFileOutcomeEnum | null;
  isReported: boolean;
};
