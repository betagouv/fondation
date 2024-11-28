import {
  ReportFileService,
  ReportSignedUrl,
} from 'src/reports-context/business-logic/gateways/services/report-file-service';
import { ReportAttachedFile } from 'src/reports-context/business-logic/models/report-attached-file';

export class FakeReportFileService implements ReportFileService {
  static BASE_URL = 'http://example.fr' as const;

  uploadError: Error;
  files: Record<
    string,
    {
      name: string;
      signedUrl: string;
    }
  > = {};

  async uploadFile(file: ReportAttachedFile, bucket: string): Promise<void> {
    if (this.uploadError) throw this.uploadError;

    const snapshot = file.toSnapshot();

    this.files[snapshot.fileId] = {
      name: snapshot.name,
      signedUrl: `${FakeReportFileService.BASE_URL}/${bucket}/${snapshot.reportId}/${snapshot.name}`,
    };
  }

  async getSignedUrls(attachedFileIds: string[]): Promise<ReportSignedUrl[]> {
    return attachedFileIds.map((fileId) => {
      if (!this.files[fileId]) {
        throw new Error(`File not found: ${fileId}`);
      }
      return this.files[fileId];
    });
  }

  async deleteFile(file: ReportAttachedFile): Promise<void> {
    delete this.files[file.toSnapshot().fileId];
  }
}
