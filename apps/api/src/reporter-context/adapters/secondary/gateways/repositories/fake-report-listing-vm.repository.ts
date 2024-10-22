import { ReportListingVM, ReportListItemVM } from '@/shared-models';
import { ReportListingVMQuery } from 'src/reporter-context/business-logic/gateways/queries/report-listing-vm.query';

export class FakeReportListingVMRepository implements ReportListingVMQuery {
  reportsList: ReportListItemVM[] = [];

  async listReports(): Promise<ReportListingVM> {
    return {
      data: this.reportsList,
    };
  }
}
