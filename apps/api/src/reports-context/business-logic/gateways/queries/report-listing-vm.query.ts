import { ReportListingVM } from 'shared-models';

export interface ReportListingQuery {
  listReports(): Promise<ReportListingVM>;
}
