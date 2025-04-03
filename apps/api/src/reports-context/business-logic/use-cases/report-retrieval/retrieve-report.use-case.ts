import { ReportRetrievalVM } from 'shared-models';
import { ReportRetrievalQuery } from '../../gateways/queries/report-retrieval-vm.query';

export class RetrieveReportUseCase {
  constructor(private reportRetrievalVMQuery: ReportRetrievalQuery) {}

  async execute(
    id: string,
    reporterId: string,
  ): Promise<ReportRetrievalVM | null> {
    const report = await this.reportRetrievalVMQuery.retrieveReport(
      id,
      reporterId,
    );
    if (!report) return null;

    const { files, ...rest } = report;

    return {
      ...rest,
      attachedFiles: files,
    };
  }
}
