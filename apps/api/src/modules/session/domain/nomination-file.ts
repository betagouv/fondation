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
  observers: string[];
  reporters: string[];
  biography: string;
};

export type NominationFileEntity = { id: string } & NominationFile;
