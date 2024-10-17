import { NominationFileRepository } from 'src/data-administrator-context/business-logic/gateways/repositories/nomination-file-repository';
import { NominationFileModel } from 'src/data-administrator-context/business-logic/models/nomination-file';
import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { QueryRunner } from 'typeorm';
import { NominationFilePm } from './entities/nomination-file-pm';

export class SqlNominationFileRepository implements NominationFileRepository {
  byId: (nominationFileId: string) => TransactionableAsync<NominationFileModel>;
  save(nominationFile: NominationFileModel): TransactionableAsync<void> {
    const nominationFileSnapshot = nominationFile.toSnapshot();

    return async (queryRunner: QueryRunner) => {
      await queryRunner.manager.save(
        new NominationFilePm(
          nominationFileSnapshot.id,
          nominationFileSnapshot.rowNumber,
          nominationFileSnapshot.reportId,
          nominationFileSnapshot.content,
        ),
      );
    };
  }
}
