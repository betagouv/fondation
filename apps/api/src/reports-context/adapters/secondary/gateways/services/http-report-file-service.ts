import { ReportFileService } from 'src/reports-context/business-logic/gateways/services/report-file-service';
import { Readable } from 'stream';
import typia from 'typia';
import FormData from 'form-data';
import axios from 'axios';

export class HttpReportFileService implements ReportFileService {
  async uploadFile(name: string, stream: Readable): Promise<string> {
    const formData = new FormData();
    formData.append('file', stream, name);

    const response = await axios.post(
      'http://localhost:3000/api/files/upload',
      formData,
      {
        headers: formData.getHeaders(),
      },
    );

    if (!(response.status === 201)) {
      throw new Error(
        `Failed to upload file to File Context: ${response.statusText}`,
      );
    }

    const fileId = await response.data;
    typia.assertGuardEquals<string>(fileId);
    return fileId;
  }
}
