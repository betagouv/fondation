import { ReportRuleRepository } from '../../gateways/repositories/report-rule.repository';

export class ChangeRuleValidationStateUseCase {
  constructor(private readonly reportRuleRepository: ReportRuleRepository) {}

  async execute(id: string, validated: boolean) {
    const reportRule = await this.reportRuleRepository.byId(id);
    if (reportRule) {
      reportRule.validate(validated);
      await this.reportRuleRepository.save(reportRule);
    }
  }
}
