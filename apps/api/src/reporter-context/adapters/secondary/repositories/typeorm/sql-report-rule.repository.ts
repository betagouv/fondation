import { ReportRuleRepository } from 'src/reporter-context/business-logic/gateways/repositories/report-rule.repository';
import { ReportRule } from 'src/reporter-context/business-logic/models/report-rules';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { ReportRulePm } from './entities/report-rule-pm';
import { QueryRunner } from 'typeorm';

export class SqlReportRuleRepository implements ReportRuleRepository {
  byId(id: string): TransactionableAsync<ReportRule | null> {
    return async (queryRunner: QueryRunner) => {
      const reportRulePm = await queryRunner.manager.findOne(ReportRulePm, {
        where: { id },
      });

      if (!reportRulePm) return null;
      const reportRuleSnapshot = {
        id: reportRulePm.id,
        ruleGroup: reportRulePm.ruleGroup,
        ruleName: reportRulePm.ruleName,
        preValidated: reportRulePm.preValidated,
        validated: reportRulePm.validated,
        comment: reportRulePm.comment,
        reportId: reportRulePm.reportId,
      };
      return ReportRule.fromSnapshot(reportRuleSnapshot);
    };
  }

  save(reportRule: ReportRule): TransactionableAsync<void> {
    return async (queryRunner: QueryRunner) => {
      const reportRuleSnapshot = reportRule.toSnapshot();
      await queryRunner.manager.save(
        ReportRulePm,
        new ReportRulePm(
          reportRuleSnapshot.id,
          reportRuleSnapshot.ruleGroup,
          reportRuleSnapshot.ruleName,
          reportRuleSnapshot.preValidated,
          reportRuleSnapshot.validated,
          reportRuleSnapshot.comment,
          reportRuleSnapshot.reportId,
        ),
      );
    };
  }
}
