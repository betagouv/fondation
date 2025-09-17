import { FullName } from 'src/reports-context/business-logic/models/full-name';
import { Reporter } from 'src/reports-context/business-logic/models/reporter';
import { UserService } from 'src/shared-kernel/business-logic/gateways/services/user.service';

export class ReporterTranslatorService {
  constructor(private readonly userService: UserService) {}

  async reporterWithId(reporterId: string): Promise<Reporter> {
    const user = await this.userService.userWithId(reporterId);
    return new Reporter(
      user.userId,
      new FullName(user.firstName, user.lastName),
    );
  }
}
