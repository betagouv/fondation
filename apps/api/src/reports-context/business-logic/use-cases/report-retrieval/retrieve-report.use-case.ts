import { ReportRetrievalQuery } from '../../gateways/queries/report-retrieval-vm.query';

export class RetrieveReportUseCase {
  constructor(private reportRetrievalVMQuery: ReportRetrievalQuery) {}

  async execute(id: string) {
    return this.reportRetrievalVMQuery.retrieveReport(id);
  }
}
