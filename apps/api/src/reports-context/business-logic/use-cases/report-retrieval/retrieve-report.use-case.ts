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

    const { attachedFilesVO, ...rest } = report;
    const attachedFiles = attachedFilesVO.hasFiles()
      ? await this.reportFileService.getSignedUrls(attachedFilesVO)
      : null;

    return {
      ...rest,
      attachedFiles,
    };
  }
}
