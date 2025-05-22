import { ReportListItemQueried } from 'shared-models';
import { ReportListingQuery } from 'src/reports-context/business-logic/gateways/queries/report-listing-vm.query';

export class FakeReportListingVMRepository implements ReportListingQuery {
  reportsList: Record<string, ReportListItemQueried[]> = {};

  async listReports(reporterId: string): Promise<ReportListItemQueried[]> {
    const userReports = Object.entries(this.reportsList)
      .filter(([id]) => id === reporterId)
      .map(([, reports]) => reports)
      .flat();

    return userReports;
  }
}
