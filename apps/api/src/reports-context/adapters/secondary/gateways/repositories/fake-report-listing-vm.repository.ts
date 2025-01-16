import { ReportListingVM, ReportListItemVM } from 'shared-models';
import { ReportListingQuery } from 'src/reports-context/business-logic/gateways/queries/report-listing-vm.query';

export class FakeReportListingVMRepository implements ReportListingQuery {
  reportsList: Record<string, ReportListItemVM[]> = {};

  async listReports(reporterId: string): Promise<ReportListingVM> {
    const userReports = Object.entries(this.reportsList)
      .filter(([id]) => id === reporterId)
      .map(([, reports]) => reports)
      .flat();

    return {
      data: userReports,
    };
  }
}
