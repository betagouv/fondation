import { ReportListingVMRepository } from '../../gateways/repositories/ReportListingVM.repository';

export class ListReportsUseCase {
  constructor(
    private readonly reportListingVMRepository: ReportListingVMRepository,
  ) {}

  async execute() {
    return this.reportListingVMRepository.listReports();
  }
}
