import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { NominationFileReport } from '../../models/nomination-file-report';

export interface ReportRepository {
  byId(id: string): TransactionableAsync<NominationFileReport | null>;
  save(report: NominationFileReport): TransactionableAsync<void>;
}
