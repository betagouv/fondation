import { DateOnlyJson } from "./date";
import { Magistrat } from "./magistrat.namespace";
import { NominationFile } from "./nomination-file.namespace";
import { Transparency } from "./transparency.enum";

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
  grade: Magistrat.Grade;
  currentPosition: string;
  targettedPosition: string;
  comment: string | null;
  rank: string;
  observers: string[] | null;
  rules: NominationFile.Rules<NominationFile.RuleValue>;
  attachedFiles: AttachedFileVM[] | null;
}
