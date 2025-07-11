import { type DateOnlyJson } from "./date";
import { type Magistrat } from "./magistrat.namespace";
import { type NominationFile } from "./nomination-file.namespace";
import { type Transparency } from "./transparency.enum";

export enum ReportFileUsage {
  ATTACHMENT = "ATTACHMENT",
  EMBEDDED_SCREENSHOT = "EMBEDDED_SCREENSHOT",
}

export type AttachedFileVM = {
  usage: ReportFileUsage;
  name: string;
  fileId: string;
};

export interface ReportRetrievalVM {
  id: string;
  folderNumber: number | null;
  biography: string | null;
  dueDate: DateOnlyJson | null;
  name: string;
  birthDate: DateOnlyJson;
  state: NominationFile.ReportState;
  formation: Magistrat.Formation;
  transparency: Transparency;
  dateTransparence: DateOnlyJson;
  grade: Magistrat.Grade;
  currentPosition: string;
  targettedPosition: string;
  comment: string | null;
  rank: string;
  observers: string[] | null;
  rules: NominationFile.Rules<NominationFile.RuleValue>;
  attachedFiles: AttachedFileVM[] | null;
  dureeDuPoste: string | null;
}
