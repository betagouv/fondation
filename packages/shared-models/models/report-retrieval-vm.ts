import { DateOnlyJson } from "./date";
import { Magistrat } from "./magistrat.namespace";
import { NominationFile } from "./nomination-file.namespace";
import { Transparency } from "./transparency.enum";

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
