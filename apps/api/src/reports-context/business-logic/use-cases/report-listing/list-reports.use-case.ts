import { ReportListingVMQuery } from '../../gateways/queries/report-listing-vm.query';

export class ListReportsUseCase {
  constructor(
    private readonly reportListingVMRepository: ReportListingVMQuery,
  ) {}

  async execute() {
    return this.reportListingVMRepository.listReports();
  }
}
