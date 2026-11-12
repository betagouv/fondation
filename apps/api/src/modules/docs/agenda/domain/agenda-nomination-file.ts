import { GradeEnum } from '../../../shared/grade.enum';
import { DocNominationFileOutcomeEnum } from '../../shared/domain/doc-nomination-file-outcome';
import { NamedMember } from '../../shared/domain/named-member';

export type AgendaNominationFile = {
  id: string;
  name: string;
  number: number;
  grade: GradeEnum;
  targetedGrade: GradeEnum;
  currentPosition: string | null;
  targetedPosition: string | null;
  outcome: { value: DocNominationFileOutcomeEnum; comment: string | null } | null;
  reporters: readonly NamedMember[];
};
