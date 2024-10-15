import {
  NominationFileRead,
  NominationFileRepository,
} from 'src/data-administrator-context/business-logic/gateways/repositories/nomination-file-repository';

export class FakeNominationFileRepository implements NominationFileRepository {
  nominationFiles: NominationFileRead[] = [];

  async save(nominationFileRead: NominationFileRead): Promise<void> {
    this.nominationFiles.push(nominationFileRead);
  }
}
