import {
  DateOnlyJson,
  Magistrat,
  NominationFile,
  Transparency,
} from 'shared-models';

export interface ReportRetrievalQueried {
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
  rules: NominationFile.Rules;
  attachedFileIds: string[];
}

export interface ReportRetrievalQuery {
  retrieveReport(id: string): Promise<ReportRetrievalQueried | null>;
}
