import { ReportRetrievalVM } from '@/shared-models';

export interface ReportRetrievalVMQuery {
  retrieveReport(id: string): Promise<ReportRetrievalVM | null>;
}
