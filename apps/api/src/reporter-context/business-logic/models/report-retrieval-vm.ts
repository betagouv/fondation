import { Magistrat, NominationFile } from '@/shared-models';
import { Transparency } from '@/shared-models';
import { DateOnlyJson } from 'src/shared-kernel/business-logic/models/date-only';

export interface ReportRetrievalVM {
  id: string;
  biography: string;
  dueDate: DateOnlyJson | null;
  name: string;
  birthDate: DateOnlyJson;
  state: NominationFile.ReportState;
  formation: Magistrat.Formation;
  transparency: Transparency;
  grade: Magistrat.Grade;
  currentPosition: string;
  targettedPosition: string;
  comment: string | null;
  rank: string;
  rules: NominationFile.Rules;
}
