import { DateOnly } from '../../../../utils/date-only';
import { GradeEnum } from '../../../shared/grade.enum';
import { PriorityEnum } from '../../../shared/priority.enum';

type InternalTransparenceFile = {
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

export type LodamTransparenceFile = InternalTransparenceFile & {
  observers: string[];
  reporters: string[];
};

export type LodamTransparenceFileEntity = LodamTransparenceFile & { id: string };

export type TransparenceFile = InternalTransparenceFile & {
  priorities: PriorityEnum[];
  sortableTargetedGrade: number;
  detectedMagistratId: string | null;
  detectedJurisdictionId: string | null;
  detectedTargetedFunctionId: string | null;
  detectedTargetedPositionId: number | null;
};

export type LolfiTransparenceFile = TransparenceFile & { externalId: number };
