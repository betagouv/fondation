import { ReportListingVMQuery } from 'src/reporter-context/business-logic/gateways/queries/report-listing-vm.query';
import {
  ReportListingVM,
  ReportListItemVM,
} from 'src/reporter-context/business-logic/models/reports-listing-vm';

export class FakeReportListingVMRepository implements ReportListingVMQuery {
  reportsList: ReportListItemVM[] = [];

  async listReports(): Promise<ReportListingVM> {
    return {
      data: this.reportsList,
    };
  }
}
