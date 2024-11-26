import axios from 'axios';
import FormData from 'form-data';
import {
  ReportFileService,
  ReportSignedUrl,
} from 'src/reports-context/business-logic/gateways/services/report-file-service';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/nestia/api-config-schema';
import typia from 'typia';
import { Format } from 'typia/lib/tags';

export class HttpReportFileService implements ReportFileService {
  private readonly fileServiceUrl: URL;

  constructor(private readonly apiConfig: ApiConfig) {
    this.fileServiceUrl = new URL(
      this.apiConfig.contextServices.filesContext.baseUrl,
    );
    this.fileServiceUrl.port =
      this.apiConfig.contextServices.filesContext.port.toString();
  }

  async uploadFile(name: string, fileBuffer: Buffer): Promise<void> {
    const formData = new FormData();
    formData.append('file', fileBuffer, name);

    const fileServiceUrl = new URL(this.fileServiceUrl);
    fileServiceUrl.pathname = '/api/files/upload-one';

    const response = await axios.post(fileServiceUrl.href, formData, {
      timeout: 5000,
      headers: formData.getHeaders(),
    });

    if (!(response.status === 201)) {
      throw new Error(
        `Failed to upload file to File Context: ${response.statusText}`,
      );
    }

    const fileId = await response.data;
    typia.assertGuardEquals<string & Format<'uuid'>>(fileId);
  }

  async getSignedUrls(attachedFileNames: string[]): Promise<ReportSignedUrl[]> {
    const fileServiceUrl = new URL(this.fileServiceUrl);
    fileServiceUrl.pathname = '/api/files';
    attachedFileNames.forEach((name) =>
      fileServiceUrl.searchParams.append('names', name.toString()),
    );

    const response = await fetch(fileServiceUrl);
    if (!response.ok) throw new Error('Failed to get files signed URLs');
    const signedUrls = await response.json();

    typia.assertGuardEquals<ReportSignedUrl[]>(signedUrls);
    return signedUrls;
  }
}
