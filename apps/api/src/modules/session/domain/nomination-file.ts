import { Magistrat } from 'shared-models';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';

export type NominationFile = {
  fileNumber: number;
  name: string;
  rank: string | null;
  grade: Magistrat.Grade;
  targetedPosition: string;
  birthDate: DateOnly | null;
  currentPosition: string;
  lastPositionDate: DateOnly | null;
  lastRankingDate: DateOnly | null;
  observers: string[];
  reporters: string[];
  biography: string | null;
  careerInformation: string | null;
};

export type NominationFileEntity = { id: string } & NominationFile;
