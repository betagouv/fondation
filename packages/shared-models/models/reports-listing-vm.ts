import { type DateOnlyJson } from "./date";
import { type Magistrat } from "./magistrat.namespace";
import { type NominationFile } from "./nomination-file.namespace";

export interface ReportListItemQueried {
  id: string;
  dossierDeNominationId: string;
  sessionId: string;
  state: NominationFile.ReportState;
  formation: Magistrat.Formation;
}

export interface ReportListItemVM {
  id: string;
  sessionId: string;
  sessionImportId: string;
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
