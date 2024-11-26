import {
  ReportRetrievalQueried,
  ReportRetrievalQuery,
} from 'src/reports-context/business-logic/gateways/queries/report-retrieval-vm.query';
export class FakeReportRetrievalVMQuery implements ReportRetrievalQuery {
  reports: Record<string, ReportRetrievalQueried> = {};

  async retrieveReport(id: string): Promise<ReportRetrievalQueried | null> {
    const report = this.reports[id];
    return report || null;
  }
}
