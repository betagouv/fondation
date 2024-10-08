import { ReportListingVM } from '../../models/reports-listing-vm';

export interface ReportListingVMQuery {
  listReports(): Promise<ReportListingVM>;
}
