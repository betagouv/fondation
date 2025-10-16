import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { NominationFileReport } from '../../models/nomination-file-report';

export interface ReportRepository {
  save(report: NominationFileReport): TransactionableAsync<void>;
  byId(id: string): TransactionableAsync<NominationFileReport | null>;
  byNominationFileId(
    nominationFileId: string,
  ): TransactionableAsync<NominationFileReport[] | null>;
  bySessionId(sessionId: string): TransactionableAsync<NominationFileReport[]>;
  delete(reportId: string): TransactionableAsync<void>;
}
