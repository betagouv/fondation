import { ReportRetrievalVMQuery } from '../../gateways/queries/report-retrieval-vm.query';

export class RetrieveReportUseCase {
  constructor(private reportRetrievalVMQuery: ReportRetrievalVMQuery) {}

  async execute(id: string) {
    return this.reportRetrievalVMQuery.retrieveReport(id);
  }
}
