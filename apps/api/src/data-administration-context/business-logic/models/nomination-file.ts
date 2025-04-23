import _ from 'lodash';
import { NominationFileRead } from './nomination-file-read';
import { DomainRegistry } from './domain-registry';

export type NominationFileModelSnapshot = {
  id: string;
  createdAt: Date;
  rowNumber: NominationFileRead['rowNumber'];
  content: NominationFileRead['content'];
};

export type NominationFileUpdatedContent = Pick<
  NominationFileRead['content'],
  'folderNumber' | 'observers' | 'rules'
>;
export class NominationFileModel {
  private constructor(
    private readonly id: string,
    private readonly createdAt: Date,
    private nominationFileRead: NominationFileRead,
  ) {}

  updateFolderNumber(folderNumber: number) {
    this.nominationFileRead.content.folderNumber = folderNumber;
  }
  updateObservers(observers: string[]) {
    this.nominationFileRead.content.observers = observers;
  }
  updateRules(rules: NominationFileRead['content']['rules']) {
    this.nominationFileRead.content.rules = _.merge(
      this.nominationFileRead.content.rules,
      rules,
    );
  }

  toSnapshot(): NominationFileModelSnapshot {
    return {
      id: this.id,
      createdAt: this.createdAt,
      rowNumber: this.nominationFileRead.rowNumber,
      content: this.nominationFileRead.content,
    };
  }

  static fromSnapshot(
    snapshot: NominationFileModelSnapshot,
  ): NominationFileModel {
    return new NominationFileModel(snapshot.id, snapshot.createdAt, {
      rowNumber: snapshot.rowNumber,
      content: snapshot.content,
    });
  }

  static create(nominationFileRead: NominationFileRead) {
    const id = DomainRegistry.uuidGenerator().generate();
    const createdAt = DomainRegistry.dateTimeProvider().now();
    return new NominationFileModel(id, createdAt, nominationFileRead);
  }
}
