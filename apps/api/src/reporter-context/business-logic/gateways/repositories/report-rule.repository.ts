import { ReportRule } from '../../models/report-rules';

export interface ReportRuleRepository {
  byId(id: string): Promise<ReportRule | null>;
  save(report: ReportRule): Promise<void>;
}
