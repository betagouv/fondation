import {
  FileUpload,
  ReportFileService,
} from 'src/reports-context/business-logic/gateways/services/report-file-service';
import { NominationFileReportSnapshot } from 'src/reports-context/business-logic/models/nomination-file-report';
import { ReportAttachedFile } from 'src/reports-context/business-logic/models/report-attached-file';

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
