import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import {
  NominationFileModel,
  NominationFileModelSnapshot,
} from '../../models/nomination-file';
import { Transparency } from 'shared-models';

export interface NominationFileRepository {
  findAll(): TransactionableAsync<NominationFileModel[]>;
  findSnapshotsPerTransparency(
    transparence: Transparency,
  ): TransactionableAsync<NominationFileModelSnapshot[]>;
  save(nominationFile: NominationFileModel): TransactionableAsync;
}
