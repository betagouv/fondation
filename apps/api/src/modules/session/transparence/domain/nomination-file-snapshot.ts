import { NominationFileOutcomeEnum } from 'src/modules/shared/nomination-file-outcome.enum';

export type NominationFileSnapshot = {
  auditionRequired: boolean;
  id: string;
  isReported: boolean;
  outcome: NominationFileOutcomeEnum | null;
  positionRequiresAudition: boolean;
};
