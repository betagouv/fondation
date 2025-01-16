import { UserService } from 'src/reports-context/business-logic/gateways/services/user.service';
import { Reporter } from 'src/reports-context/business-logic/models/reporter';

export class ReporterTranslatorService {
  constructor(private readonly httpReportService: UserService) {}

  async reporterFrom(reporterName: string): Promise<Reporter> {
    const user = await this.httpReportService.userWithFullName(reporterName);
    return new Reporter(user.userId);
  }
}
