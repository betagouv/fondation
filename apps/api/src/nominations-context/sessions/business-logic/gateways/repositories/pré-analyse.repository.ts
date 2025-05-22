import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { PréAnalyse } from '../../models/pré-analyse';

export interface PréAnalyseRepository {
  save(préAnalyse: PréAnalyse): TransactionableAsync;
  findByDossierId(dossierId: string): TransactionableAsync<PréAnalyse | null>;
}
