import { DateOnlyJson } from "./date";
import { Magistrat } from "./magistrat.namespace";
import { NominationFile } from "./nomination-file.namespace";
import { Transparency } from "./transparency.enum";

export interface ReportListItemVM {
  id: string;
  folderNumber: number | null;
  state: NominationFile.ReportState;
  dueDate: DateOnlyJson | null;
  formation: Magistrat.Formation;
  name: string;
  reporterName: string | null;
  transparency: Transparency;
  grade: Magistrat.Grade;
  targettedPosition: string;
  observersCount: number;
}

export interface ReportListingVM {
  data: ReportListItemVM[];
}
