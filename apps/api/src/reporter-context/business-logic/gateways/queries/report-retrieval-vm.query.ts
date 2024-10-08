import { ReportRetrievalVM } from '../../models/report-retrieval-vm';

export interface ReportRetrievalVMQuery {
  retrieveReport(id: string): Promise<ReportRetrievalVM | null>;
}
