import { ReportRuleRepository } from 'src/reporter-context/business-logic/gateways/repositories/report-rule.repository';
import { ReportRule } from 'src/reporter-context/business-logic/models/report-rules';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';

export class FakeReportRuleRepository implements ReportRuleRepository {
  reportRules: Record<string, ReportRule> = {};

  byId(id: string): TransactionableAsync<ReportRule | null> {
    return async () => {
      const reportRule = this.reportRules[id];
      return reportRule || null;
    };
  }
  save(reportRule: ReportRule): TransactionableAsync<void> {
    return async () => {
      this.reportRules[reportRule.getId()] = reportRule;
    };
  }
}
