import { Magistrat, NominationFile } from '@/shared-models';
import { Transparency } from '@/shared-models';
import { DateOnlyVM } from 'src/shared-kernel/business-logic/models/date-only';

export interface ReportRetrievalVM {
  id: string;
  biography: string;
  dueDate: DateOnlyVM | null;
  name: string;
  birthDate: DateOnlyVM;
  state: NominationFile.ReportState;
  formation: Magistrat.Formation;
  transparency: Transparency;
  grade: Magistrat.Grade;
  targettedPosition: string;
  comments: string | null;
  rules: NominationFile.Rules;
}
