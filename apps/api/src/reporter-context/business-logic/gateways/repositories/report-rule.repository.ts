import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { ReportRule } from '../../models/report-rules';

export interface ReportRuleRepository {
  byId(id: string): TransactionableAsync<ReportRule | null>;
  save(report: ReportRule): TransactionableAsync<void>;
}
