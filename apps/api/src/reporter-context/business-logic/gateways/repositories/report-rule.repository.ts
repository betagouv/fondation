import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { ReportRule } from '../../models/report-rules';
import { NominationFile } from 'shared-models';

export interface ReportRuleRepository {
  byName(
    reportId: string,
    ruleGroup: NominationFile.RuleGroup,
    ruleName: NominationFile.RuleName,
  ): TransactionableAsync<ReportRule | null>;
  byId(id: string): TransactionableAsync<ReportRule | null>;
  save(report: ReportRule): TransactionableAsync<void>;
}
