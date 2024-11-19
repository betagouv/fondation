import { ReportRetrievalVM } from 'shared-models';

export interface ReportRetrievalQuery {
  retrieveReport(id: string): Promise<ReportRetrievalVM | null>;
}
