import { Magistrat } from 'shared-models';

import { DocNominationFileOutcomeEnum } from './doc-nomination-file-outcome';

export type AgendaNominationFile = {
  id: string;
  name: string;
  number: number;
  grade: Magistrat.Grade;
  targetedGrade: Magistrat.Grade;
  currentPosition: string | null;
  targetedPosition: string | null;
  outcome: { value: DocNominationFileOutcomeEnum; comment: string | null } | null;
  reporters: readonly string[];
};
