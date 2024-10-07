import { ReportListingVMRepository } from 'src/reporter-context/business-logic/gateways/repositories/ReportListingVM.repository';
import {
  ReportListingVM,
  ReportListItemVM,
} from 'src/reporter-context/business-logic/models/ReportsListingVM';

export class FakeReportListingVMRepository
  implements ReportListingVMRepository
{
  reportsList: ReportListItemVM[] = [];

  async listReports(): Promise<ReportListingVM> {
    return {
      data: this.reportsList,
    };
  }
}
