import { ReportRuleRepository } from 'src/reporter-context/business-logic/gateways/repositories/report-rule.repository';
import { ReportRule } from 'src/reporter-context/business-logic/models/report-rules';

export class FakeReportRuleRepository implements ReportRuleRepository {
  reportRules: Record<string, ReportRule>;

  async byId(id: string): Promise<ReportRule | null> {
    const reportRule = this.reportRules[id];
    return reportRule || null;
  }
  async save(reportRule: ReportRule): Promise<void> {
    this.reportRules[reportRule.getId()] = reportRule;
  }
}
