import { ReportRepository } from '../../gateways/repositories/report.repository';
import { NominationFileRuleName } from '../../models/nomination-file-report';

export class ChangeRuleValidationStateUseCase {
  constructor(
    private readonly nominationFileReportRepository: ReportRepository,
  ) {}

  async execute(
    reportId: string,
    rule: NominationFileRuleName,
    validated: boolean,
  ) {
    const report = await this.nominationFileReportRepository.byId(reportId);
    if (report) {
      report.managementRules[rule] = { validated };
      await this.nominationFileReportRepository.save(report);
    }
  }
}
