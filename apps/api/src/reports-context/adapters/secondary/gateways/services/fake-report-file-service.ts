import {
  FileUpload,
  ReportFileService,
  ReportSignedUrl,
} from 'src/reports-context/business-logic/gateways/services/report-file-service';
import { NominationFileReportSnapshot } from 'src/reports-context/business-logic/models/nomination-file-report';
import { ReportAttachedFile } from 'src/reports-context/business-logic/models/report-attached-file';
import { ReportAttachedFiles } from 'src/reports-context/business-logic/models/report-attached-files';

export class FakeReportFileService implements ReportFileService {
  static BASE_URL = 'http://example.fr' as const;

  uploadError: Error;
  deleteFileError: Error;
  deleteFilesError: Error;

  currentReport: NominationFileReportSnapshot;
  files: Record<
    string,
    {
      name: string;
      signedUrl?: string;
    }
  > = {};

  async uploadFile(file: ReportAttachedFile): Promise<void> {
    if (this.uploadError) throw this.uploadError;

    const snapshot = file.toSnapshot();

    this.files[snapshot.fileId] = {
      name: snapshot.name,
    };
  }

  async uploadFiles(fileUploads: FileUpload[]): Promise<void> {
    if (this.uploadError) throw this.uploadError;

    for (const { file } of fileUploads) {
      const snapshot = file.toSnapshot();
      this.files = {
        ...this.files,
        [snapshot.fileId]: {
          name: snapshot.name,
        },
      };
    }
  }

  async getSignedUrl(
    attachedFile: ReportAttachedFile,
  ): Promise<ReportSignedUrl> {
    const signedUrls = await this.getSignedUrls(
      new ReportAttachedFiles([attachedFile]),
    );
    return signedUrls[0]!;
  }

  async getSignedUrls(
    attachedFiles: ReportAttachedFiles,
  ): Promise<ReportSignedUrl[]> {
    return attachedFiles.getFileIds().map((fileId) => {
      const file = this.files[fileId];
      if (!file) {
        throw new Error(`File not found: ${fileId}`);
      }
      if (!file.signedUrl)
        throw new Error(`File without signed url: ${fileId}`);

      return {
        name: file.name,
        signedUrl: file.signedUrl,
      };
    });
  }

  async deleteFile(file: ReportAttachedFile): Promise<void> {
    if (this.deleteFileError) throw this.deleteFileError;

    delete this.files[file.toSnapshot().fileId];
  }

  async deleteFiles(files: ReportAttachedFile[]): Promise<void> {
    if (this.deleteFilesError) {
      throw this.deleteFilesError;
    }

    for (const file of files) {
      delete this.files[file.fileId];
    }
  }
}
