import { Magistrat, NominationFile } from 'shared-models';
import { ReportAttachedFilesSerialized } from '../../models/report-attached-files';

export interface ReportRetrievalQueried {
  id: string;
  dossierDeNominationId: string;
  sessionId: string;
  state: NominationFile.ReportState;
  formation: Magistrat.Formation;
  comment: string | null;
  files: ReportAttachedFilesSerialized;
  rules: NominationFile.Rules;
}

export interface ReportRetrievalQuery {
  retrieveReport(
    id: string,
    reporterId: string,
  ): Promise<ReportRetrievalQueried | null>;
}
