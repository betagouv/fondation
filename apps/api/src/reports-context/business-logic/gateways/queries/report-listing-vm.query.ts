import { ReportListItemQueried } from 'shared-models';

export interface ReportListingQuery {
  listReports(reporterId: string): Promise<ReportListItemQueried[]>;
  listReportsByDnId(dnId: string): Promise<ReportListItemQueried[]>;
}
