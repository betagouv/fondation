import { Magistrat } from 'shared-models';
import { DateOnly } from 'src/utils/date-only';

type InternalNominationFile = {
  fileNumber: number;
  name: string;
  rank: string | null;
  grade: Magistrat.Grade;
  targetedGrade: Magistrat.Grade;
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
  sortableTargetedGrade: number;
  detectedMagistratId: string | null;
  detectedJurisdictionId: string | null;
  detectedTargetedFunctionId: string | null;
  detectedTargetedPositionId: number | null;
};

export type NominationFileEntity = NominationFile & { id: string };
