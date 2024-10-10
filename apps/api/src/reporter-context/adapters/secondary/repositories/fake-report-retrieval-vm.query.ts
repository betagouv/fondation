import { ReportRetrievalVMQuery } from 'src/reporter-context/business-logic/gateways/queries/report-retrieval-vm.query';
import { ReportRetrievalVM } from 'src/reporter-context/business-logic/models/report-retrieval-vm';

export class FakeReportRetrievalVMQuery implements ReportRetrievalVMQuery {
  reports: Record<string, ReportRetrievalVM> = {};

  async retrieveReport(id: string): Promise<ReportRetrievalVM | null> {
    const report = this.reports[id];
    return report || null;
  }
}
