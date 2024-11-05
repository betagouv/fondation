import { NominationFile } from 'shared-models';
import { ReportRuleRepository } from 'src/reporter-context/business-logic/gateways/repositories/report-rule.repository';
import { ReportRule } from 'src/reporter-context/business-logic/models/report-rules';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';

export class FakeReportRuleRepository implements ReportRuleRepository {
  reportRules: Record<string, ReportRule> = {};

  byName(
    reportId: string,
    ruleGroup: NominationFile.RuleGroup,
    ruleName: NominationFile.RuleName,
  ): TransactionableAsync<ReportRule | null> {
    return async () => {
      const reportRule = Object.values(this.reportRules).find(
        (reportRule) =>
          reportRule.isRuleOfReportId(reportId) &&
          reportRule.isRuleName(ruleGroup, ruleName),
      );
      return reportRule || null;
    };
  }

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
