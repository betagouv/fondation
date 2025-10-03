import { ReportListItemQueried } from 'shared-models';
import { ReportListingQuery } from 'src/reports-context/business-logic/gateways/queries/report-listing-vm.query';

export class ListReportByDnIdUseCase {
  constructor(private readonly reportListingQuery: ReportListingQuery) {}

  async execute(dnId: string): Promise<ReportListItemQueried[]> {
    return this.reportListingQuery.listReportsByDnId(dnId);
  }
}
