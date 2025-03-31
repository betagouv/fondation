import { ReportRetrievalVM } from 'shared-models';
import {
  ReportRetrievalQueried,
  ReportRetrievalQuery,
} from '../../gateways/queries/report-retrieval-vm.query';
import { ReportFileService } from '../../gateways/services/report-file-service';
import { ReportAttachedFiles } from '../../models/report-attached-files';

export class RetrieveReportUseCase {
  constructor(
    private reportRetrievalVMQuery: ReportRetrievalQuery,
    private reportFileService: ReportFileService,
  ) {}

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
    const attachedFiles = files?.length ? await this.genFiles(files) : null;

    return {
      ...rest,
      attachedFiles,
    };
  }

  private async genFiles(
    files: NonNullable<ReportRetrievalQueried['files']>,
  ): Promise<ReportRetrievalVM['attachedFiles']> {
    const signedUrls = await this.reportFileService.getSignedUrls(
      ReportAttachedFiles.deserialize(files),
    );

    return signedUrls.map(({ signedUrl, name }) => {
      const file = files.find((f) => f.name === name);
      if (!file)
        console.error(
          `Pre-signed url with name ${name} not found. File names are: ${files.map((f) => f.name).join(', ')}`,
        );

      return {
        usage: file!.usage,
        name,
        signedUrl,
      };
    });
  }
}
