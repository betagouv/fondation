import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { NominationFileModel } from '../../models/nomination-file';

export interface NominationFileRepository {
  findAll(): TransactionableAsync<NominationFileModel[]>;
  save(nominationFile: NominationFileModel): TransactionableAsync;
}
