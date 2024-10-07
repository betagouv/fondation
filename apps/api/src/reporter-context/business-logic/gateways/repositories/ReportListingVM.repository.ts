import { ReportListingVM } from '../../models/ReportsListingVM';

export interface ReportListingVMRepository {
  listReports(): Promise<ReportListingVM>;
}
