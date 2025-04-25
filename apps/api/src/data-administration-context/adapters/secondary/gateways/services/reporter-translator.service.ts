import { UserService } from 'src/data-administration-context/business-logic/gateways/services/user.service';
import { Reporter } from 'src/data-administration-context/business-logic/models/reporter';

export class ReporterTranslatorService {
  constructor(private readonly reportService: UserService) {}

  async reporterWithFullName(reporterName: string): Promise<Reporter> {
    const user = await this.reportService.userWithFullName(reporterName);
    return new Reporter(user.userId);
  }
}
