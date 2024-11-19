import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { ReportAttachedFile } from '../../models/report-attached-file';

export interface ReportAttachedFileRepository {
  save(reportAttachedFile: ReportAttachedFile): TransactionableAsync;
}
