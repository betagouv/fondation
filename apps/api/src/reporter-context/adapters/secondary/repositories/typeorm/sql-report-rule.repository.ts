import { ReportRuleRepository } from 'src/reporter-context/business-logic/gateways/repositories/report-rule.repository';
import { ReportRule } from 'src/reporter-context/business-logic/models/report-rules';
import { DataSource } from 'typeorm';
import { ReportRulePm } from './entities/report-rule-pm';

export class SqlReportRuleRepository implements ReportRuleRepository {
  constructor(private dataSource: DataSource) {}

  async byId(id: string): Promise<ReportRule | null> {
    const reportRulePm = await this.dataSource.manager.findOne(ReportRulePm, {
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
  }

  async save(reportRule: ReportRule): Promise<void> {
    const reportRuleSnapshot = reportRule.toSnapshot();
    await this.dataSource.manager.save(
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
  }
}
