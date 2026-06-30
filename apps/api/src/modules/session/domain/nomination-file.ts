import { DocNominationFileOutcomeEnum } from 'src/modules/docs/shared/domain/doc-nomination-file-outcome';
import { GradeEnum } from 'src/modules/shared/grade.enum';
import { PriorityEnum } from 'src/modules/shared/priority.enum';
import { DateOnly } from 'src/utils/date-only';

import { NominationFileOutcomeEnum } from './nomination-file-outcome';

type InternalNominationFile = {
  fileNumber: number;
  name: string;
  rank: string | null;
  grade: GradeEnum;
  targetedGrade: GradeEnum;
  targetedPosition: string;
  birthDate: DateOnly | null;
  currentPosition: string;
  lastPositionDate: DateOnly | null;
  lastRankingDate: DateOnly | null;
  biography: string | null;
  careerInformation: string | null;
};

export type LodamNominationFile = InternalNominationFile & {
  observers: string[];
  reporters: string[];
};

export type LodamNominationFileEntity = LodamNominationFile & { id: string };

export type NominationFile = InternalNominationFile & {
  priorities: PriorityEnum[];
  sortableTargetedGrade: number;
  detectedMagistratId: string | null;
  detectedJurisdictionId: string | null;
  detectedTargetedFunctionId: string | null;
  detectedTargetedPositionId: number | null;
};

export type LolfiNominationFile = NominationFile & { externalId: number };

type TransparenceFileDocs = {
  agenda: { id: string; outcome: DocNominationFileOutcomeEnum | null };
  officialReport: { id: string; outcome: DocNominationFileOutcomeEnum } | null;
};

export type TransparenceFileDocsSnapshot = {
  id: string;
  outcome: NominationFileOutcomeEnum | null;
  docs: readonly TransparenceFileDocs[];
};
