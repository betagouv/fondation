import axios from 'axios';
import {
  ReportFileService,
  ReportSignedUrl,
} from 'src/reports-context/business-logic/gateways/services/report-file-service';
import { ReportAttachedFile } from 'src/reports-context/business-logic/models/report-attached-file';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/nestia/api-config-schema';
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
    bucket: string,
    fileBuffer: Buffer,
  ): Promise<void> {
    const formData = file.generateFormData(fileBuffer);
    const uploadUrlHref = file.generateUrlHref(this.fileServiceUrl, bucket);
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

  async getSignedUrls(attachedFileIds: string[]): Promise<ReportSignedUrl[]> {
    const fileServiceUrl = new URL(this.fileServiceUrl);
    fileServiceUrl.pathname = '/api/files/signed-urls';
    attachedFileIds.forEach((fileId) =>
      fileServiceUrl.searchParams.append('ids', fileId),
    );

    const response = await fetch(fileServiceUrl);
    if (!response.ok) throw new Error('Failed to get files signed URLs');
    const signedUrls = await response.json();

    typia.assertGuardEquals<ReportSignedUrl[]>(signedUrls);
    return signedUrls;
  }

  async deleteFile(file: ReportAttachedFile, bucket: string): Promise<void> {
    const deleteUrl = new URL(this.fileServiceUrl);
    deleteUrl.pathname = '/api/files';
    deleteUrl.searchParams.append('bucket', bucket);
    deleteUrl.searchParams.append('path', file.generateAttachedFilePath());
    deleteUrl.searchParams.append('name', file.name);

    const response = await axios.delete(deleteUrl.href, {
      timeout: 5000,
    });

    if (!(response.status === 200)) {
      throw new Error(`Failed to delete file: ${response.statusText}`);
    }
  }
}
