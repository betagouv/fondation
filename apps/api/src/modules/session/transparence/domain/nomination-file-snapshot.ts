import { NominationFileOutcomeEnum } from 'src/modules/shared/nomination-file-outcome.enum';

export type NominationFileSnapshot = {
  auditionScheduled: boolean;
  id: string;
  isReported: boolean;
  outcome: NominationFileOutcomeEnum | null;
};
