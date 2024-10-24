import { NominationFileRepository } from 'src/data-administrator-context/business-logic/gateways/repositories/nomination-file-repository';
import { NominationFileModel } from 'src/data-administrator-context/business-logic/models/nomination-file';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';

export class FakeNominationFileRepository implements NominationFileRepository {
  nominationFiles: Record<string, NominationFileModel> = {};

  setReportId(
    nominationFileId: string,
    reportId: string,
  ): TransactionableAsync {
    return async () => {
      const nominationFile = this.nominationFiles[nominationFileId];
      this.nominationFiles[nominationFileId] = NominationFileModel.fromSnapshot(
        { ...nominationFile!.toSnapshot(), reportId },
      );
    };
  }
  save(nominationFile: NominationFileModel): TransactionableAsync<void> {
    const nominationFileSnapshot = nominationFile.toSnapshot();

    return async () => {
      this.nominationFiles[nominationFileSnapshot.id] = nominationFile;
    };
  }
}
