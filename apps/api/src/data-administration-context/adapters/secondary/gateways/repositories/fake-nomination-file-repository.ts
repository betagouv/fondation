import { NominationFileRepository } from 'src/data-administration-context/business-logic/gateways/repositories/nomination-file-repository';
import { NominationFileModel } from 'src/data-administration-context/business-logic/models/nomination-file';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';

export class FakeNominationFileRepository implements NominationFileRepository {
  nominationFiles: Record<string, NominationFileModel> = {};

  findAll(): TransactionableAsync<NominationFileModel[]> {
    return async () => {
      return Object.values(this.nominationFiles);
    };
  }

  save(nominationFile: NominationFileModel): TransactionableAsync<void> {
    const nominationFileSnapshot = nominationFile.toSnapshot();

    return async () => {
      this.nominationFiles[nominationFileSnapshot.id] = nominationFile;
    };
  }
}