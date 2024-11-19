import { ReportListingVM, ReportListItemVM } from 'shared-models';
import { ReportListingQuery } from 'src/reports-context/business-logic/gateways/queries/report-listing-vm.query';

export class FakeReportListingVMRepository implements ReportListingQuery {
  reportsList: ReportListItemVM[] = [];

  async listReports(): Promise<ReportListingVM> {
    return {
      data: this.reportsList,
    };
  }
}
