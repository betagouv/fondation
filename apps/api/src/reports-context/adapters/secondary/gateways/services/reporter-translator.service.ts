import { UserService } from 'src/reports-context/business-logic/gateways/services/user.service';
import { FullName } from 'src/reports-context/business-logic/models/full-name';
import { Reporter } from 'src/reports-context/business-logic/models/reporter';

export class ReporterTranslatorService {
  constructor(private readonly reportService: UserService) {}

  async reporterWithId(reporterId: string): Promise<Reporter> {
    const user = await this.reportService.userWithId(reporterId);
    return new Reporter(
      user.userId,
      new FullName(user.firstName, user.lastName),
    );
  }

  async reporterWithFullName(reporterName: string): Promise<Reporter> {
    const user = await this.reportService.userWithFullName(reporterName);
    return new Reporter(
      user.userId,
      new FullName(user.firstName, user.lastName),
    );
  }
}
