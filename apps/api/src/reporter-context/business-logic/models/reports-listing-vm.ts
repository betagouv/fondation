import { DateOnlyVM } from 'src/shared-kernel/business-logic/models/date-only';
import { Formation } from './enums/formation.enum';
import { Grade } from './enums/grade.enum';
import { ReportState } from './enums/report-state.enum';
import { Transparency } from './enums/transparency.enum';

export interface ReportListItemVM {
  id: string;
  state: ReportState;
  dueDate: DateOnlyVM | null;
  formation: Formation;
  name: string;
  transparency: Transparency;
  grade: Grade;
  targettedPosition: string;
}

export interface ReportListingVM {
  data: ReportListItemVM[];
}
