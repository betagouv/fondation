import { ReportListingQuery } from '../../gateways/queries/report-listing-vm.query';

export class ListReportsUseCase {
  constructor(private readonly reportListingVMRepository: ReportListingQuery) {}

  async execute() {
    return this.reportListingVMRepository.listReports();
  }
}
