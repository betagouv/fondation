import {
  DateOnlyJson,
  Magistrat,
  NominationFile,
  Transparency,
} from 'shared-models';
import { ReportAttachedFiles } from '../../models/report-attached-files';

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
  // The report retrieval includes files url generation,
  // which is closer to a write need. So we need a value object here.
  attachedFilesVO: ReportAttachedFiles;
}

export interface ReportRetrievalQuery {
  retrieveReport(id: string): Promise<ReportRetrievalQueried | null>;
}
