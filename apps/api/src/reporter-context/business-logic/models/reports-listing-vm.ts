import { NominationFile, Magistrat, Transparency } from '@/shared-models';
import { DateOnlyVM } from 'src/shared-kernel/business-logic/models/date-only';

export interface ReportListItemVM {
  id: string;
  state: NominationFile.ReportState;
  dueDate: DateOnlyVM | null;
  formation: Magistrat.Formation;
  name: string;
  transparency: Transparency;
  grade: Magistrat.Grade;
  targettedPosition: string;
}

export interface ReportListingVM {
  data: ReportListItemVM[];
}
