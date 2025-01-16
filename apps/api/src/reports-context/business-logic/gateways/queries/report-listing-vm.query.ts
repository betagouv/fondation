import { ReportListingVM } from 'shared-models';

export interface ReportListingQuery {
  listReports(reporterId: string): Promise<ReportListingVM>;
}
