import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { ReportRuleRepository } from '../../gateways/repositories/report-rule.repository';

export class ChangeRuleValidationStateUseCase {
  constructor(
    private readonly reportRuleRepository: ReportRuleRepository,
    private readonly transactionPerformer: TransactionPerformer,
  ) {}

  async execute(id: string, validated: boolean) {
    return this.transactionPerformer.perform(async (trx) => {
      const reportRule = await this.reportRuleRepository.byId(id)(trx);
      if (reportRule) {
        reportRule.validate(validated);
        await this.reportRuleRepository.save(reportRule)(trx);
      }
    });
  }
}
