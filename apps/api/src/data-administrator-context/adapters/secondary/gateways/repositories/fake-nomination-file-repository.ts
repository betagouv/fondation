import { NominationFileRepository } from 'src/data-administrator-context/business-logic/gateways/repositories/nomination-file-repository';
import { NominationFileModel } from 'src/data-administrator-context/business-logic/models/nomination-file';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';

export class FakeNominationFileRepository implements NominationFileRepository {
  nominationFiles: Record<number, NominationFileModel> = {};

  save(nominationFile: NominationFileModel): TransactionableAsync<void> {
    const nominationFileSnapshot = nominationFile.toSnapshot();

    return async () => {
      this.nominationFiles[nominationFileSnapshot.rowNumber] = nominationFile;
    };
  }
}
