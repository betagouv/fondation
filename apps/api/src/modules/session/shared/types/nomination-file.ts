import { DocNominationFileOutcomeEnum } from 'src/modules/docs/shared/domain/doc-nomination-file-outcome';

import { NominationFileOutcomeEnum } from './nomination-file-outcome';

type NominationFileDocs = {
  agenda: { id: string; outcome: DocNominationFileOutcomeEnum | null };
  officialReport: { id: string; outcome: DocNominationFileOutcomeEnum } | null;
};

export type NominationFileDocsSnapshot = {
  id: string;
  outcome: NominationFileOutcomeEnum | null;
  docs: readonly NominationFileDocs[];
};
