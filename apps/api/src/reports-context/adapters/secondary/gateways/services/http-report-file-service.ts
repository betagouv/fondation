import axios from 'axios';
import FormData from 'form-data';
import { ReportFileService } from 'src/reports-context/business-logic/gateways/services/report-file-service';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/nestia/api-config-schema';
import typia from 'typia';
import { Format } from 'typia/lib/tags';

export class HttpReportFileService implements ReportFileService {
  constructor(private readonly apiConfig: ApiConfig) {}

  async uploadFile(name: string, fileBuffer: Buffer): Promise<string> {
    const formData = new FormData();
    formData.append('file', fileBuffer, name);

    const url = new URL(this.apiConfig.contextServices.filesContext.baseUrl);
    url.port = this.apiConfig.contextServices.filesContext.port.toString();
    url.pathname = '/api/files/upload-one';

    const response = await axios.post(url.href, formData, {
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
    return fileId;
  }
}
