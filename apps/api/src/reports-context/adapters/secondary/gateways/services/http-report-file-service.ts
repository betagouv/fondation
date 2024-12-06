import axios from 'axios';
import {
  ReportFileService,
  ReportSignedUrl,
} from 'src/reports-context/business-logic/gateways/services/report-file-service';
import { ReportAttachedFile } from 'src/reports-context/business-logic/models/report-attached-file';
import { ReportAttachedFiles } from 'src/reports-context/business-logic/models/report-attached-files';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/zod/api-config-schema';
import typia from 'typia';

export class HttpReportFileService implements ReportFileService {
  private readonly fileServiceUrl: URL;

  constructor(private readonly apiConfig: ApiConfig) {
    this.fileServiceUrl = new URL(
      this.apiConfig.contextServices.filesContext.baseUrl,
    );
    this.fileServiceUrl.port =
      this.apiConfig.contextServices.filesContext.port.toString();
  }

  async uploadFile(
    file: ReportAttachedFile,
    fileBuffer: Buffer,
    filePath: string[],
  ): Promise<void> {
    const formData = file.generateUploadFormData(fileBuffer);
    const uploadUrlHref = file.generateUploadHref(
      this.fileServiceUrl,
      this.apiConfig.s3.reportsContext.attachedFilesBucketName,
      filePath,
    );
    const response = await axios.post(uploadUrlHref, formData, {
      timeout: 5000,
      headers: formData.getHeaders(),
    });

    if (!(response.status === 201)) {
      throw new Error(
        `Failed to upload file to File Context: ${response.statusText}`,
      );
    }
  }

  async getSignedUrl(
    attachedFile: ReportAttachedFile,
  ): Promise<ReportSignedUrl> {
    const signedUrls = await this.getSignedUrls(
      new ReportAttachedFiles([attachedFile]),
    );

    if (signedUrls.length === 0) {
      throw new Error(
        `Failed to get signed URL for file: ${attachedFile.fileId}`,
      );
    }

    return signedUrls[0]!;
  }

  async getSignedUrls(
    attachedFiles: ReportAttachedFiles,
  ): Promise<ReportSignedUrl[]> {
    const url = attachedFiles.createURLForSignedUrls(this.fileServiceUrl);

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to get files signed URLs');
    const signedUrls = await response.json();

    typia.assertGuardEquals<ReportSignedUrl[]>(signedUrls);
    return signedUrls;
  }

  async deleteFile(file: ReportAttachedFile): Promise<void> {
    const url = file.generateDeleteUrl(this.fileServiceUrl);

    const response = await fetch(url, {
      method: 'DELETE',
    });

    if (!(response.status === 200)) {
      throw new Error(`Failed to delete file: ${response.statusText}`);
    }
  }
}
