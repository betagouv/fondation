import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { NominationFileModel } from '../../models/nomination-file';

export interface NominationFileRepository {
  save(nominationFile: NominationFileModel): TransactionableAsync<void>;
}
