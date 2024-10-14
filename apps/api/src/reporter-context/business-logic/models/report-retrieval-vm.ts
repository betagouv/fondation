import { DateOnlyVM } from 'src/shared-kernel/business-logic/models/date-only';
import { Formation } from './enums/formation.enum';
import { Grade } from './enums/grade.enum';
import { ReportState } from './enums/report-state.enum';
import { Transparency } from './enums/transparency.enum';
import { NominationFileRules } from './report-rules';

export interface ReportRetrievalVM {
  id: string;
  biography: string;
  dueDate: DateOnlyVM | null;
  name: string;
  birthDate: DateOnlyVM;
  state: ReportState;
  formation: Formation;
  transparency: Transparency;
  grade: Grade;
  targettedPosition: string;
  comments: string | null;
  rules: NominationFileRules;
}
