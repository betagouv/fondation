import {
  ReportFileService,
  ReportSignedUrl,
} from 'src/reports-context/business-logic/gateways/services/report-file-service';

export class FakeReportFileService implements ReportFileService {
  files: Record<
    string,
    {
      name: string;
      signedUrl: string;
    }
  > = {};

  async uploadFile(): Promise<void> {}

  async getSignedUrls(attachedFileNames: string[]): Promise<ReportSignedUrl[]> {
    return attachedFileNames.map((name) => {
      if (!this.files[name]) {
        throw new Error(`File not found: ${name}`);
      }
      return this.files[name];
    });
  }
}
