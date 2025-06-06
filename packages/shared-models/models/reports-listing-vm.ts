import { DateOnlyJson } from "./date";
import { Magistrat } from "./magistrat.namespace";
import { NominationFile } from "./nomination-file.namespace";
import { Transparency } from "./transparency.enum";

export interface ReportListItemQueried {
  id: string;
  dossierDeNominationId: string;
  sessionId: string;
  state: NominationFile.ReportState;
  formation: Magistrat.Formation;
}

export interface ReportListItemVM {
  id: string;
  folderNumber: number | null;
  state: NominationFile.ReportState;
  dueDate: DateOnlyJson | null;
  formation: Magistrat.Formation;
  name: string;
  transparency: string;
  grade: Magistrat.Grade;
  targettedPosition: string;
  observersCount: number;
  dateTransparence: DateOnlyJson;
}

export interface ReportListingVM {
  data: ReportListItemVM[];
}
