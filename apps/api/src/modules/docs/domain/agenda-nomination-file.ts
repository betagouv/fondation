import { GradeEnum } from 'src/modules/shared/grade.enum';

import { DocNominationFileOutcomeEnum } from './doc-nomination-file-outcome';

export type AgendaNominationFile = {
  id: string;
  name: string;
  number: number;
  grade: GradeEnum;
  targetedGrade: GradeEnum;
  currentPosition: string | null;
  targetedPosition: string | null;
  outcome: { value: DocNominationFileOutcomeEnum; comment: string | null } | null;
  reporters: readonly string[];
};
