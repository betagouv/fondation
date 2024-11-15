import { ReportFileService } from 'src/reports-context/business-logic/gateways/services/report-file-service';

export class FakeReportFileService implements ReportFileService {
  async uploadFile(): Promise<string> {
    return 'file-id';
  }
}
