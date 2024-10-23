import { ReportListingVM } from '@/shared-models';

export interface ReportListingVMQuery {
  listReports(): Promise<ReportListingVM>;
}
