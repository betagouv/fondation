import { NominationFileReportRepository } from '../../gateways/repositories/Report.repository';
import { NominationFileRule } from '../../models/NominationFileReport';

export class ChangeRuleValidationStateUseCase {
  constructor(
    private readonly nominationFileReportRepository: NominationFileReportRepository,
  ) {}

  async execute(
    reportId: string,
    rule: NominationFileRule,
    validated: boolean,
  ) {
    const report = await this.nominationFileReportRepository.byId(reportId);
    report.managementRules[rule] = { validated };
    await this.nominationFileReportRepository.save(report);
  }
}
