import { ReportRetrievalVM } from 'shared-models';
import { ReportRetrievalQuery } from '../../gateways/queries/report-retrieval-vm.query';
import { ReportFileService } from '../../gateways/services/report-file-service';

export class RetrieveReportUseCase {
  constructor(
    private reportRetrievalVMQuery: ReportRetrievalQuery,
    private reportFileService: ReportFileService,
  ) {}

  async execute(id: string): Promise<ReportRetrievalVM | null> {
    const report = await this.reportRetrievalVMQuery.retrieveReport(id);
    if (!report) return null;

    const { attachedFileIds, ...rest } = report;
    const attachedFiles = attachedFileIds.length
      ? await this.reportFileService.getSignedUrls(attachedFileIds)
      : null;

    return {
      ...rest,
      attachedFiles,
    };
  }
}
