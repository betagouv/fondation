import { Magistrat } from 'shared-models';
import { AgendaNominationFileOutcomeEnum } from './agenda-nomination-file-outcome';

export type AgendaNominationFile = {
  id: string;
  name: string;
  number: number;
  grade: Magistrat.Grade;
  targetedGrade: Magistrat.Grade;
  currentPosition: string | null;
  targetedPosition: string | null;
  outcome: { value: AgendaNominationFileOutcomeEnum; comment: string | null };
  reporters: readonly string[];
};
