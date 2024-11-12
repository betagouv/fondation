import _ from 'lodash';
import { NominationFileRead } from './nomination-file-read';

export type NominationFileSnapshot = {
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
  constructor(
    private readonly id: string,
    private readonly createdAt: Date,
    private nominationFileRead: NominationFileRead,
  ) {}

  updateContent(updatedContent: NominationFileUpdatedContent) {
    this.nominationFileRead.content = {
      ...this.nominationFileRead.content,
      folderNumber: updatedContent.folderNumber,
      observers: updatedContent.observers,
      rules: updatedContent.rules,
    };
  }

  hasSameRowNumberAs(nominationFileRead: NominationFileRead): boolean {
    return this.nominationFileRead.rowNumber === nominationFileRead.rowNumber;
  }

  hasSameFolderNumberAs(nominationFileRead: NominationFileRead) {
    return (
      this.nominationFileRead.content.folderNumber ===
      nominationFileRead.content.folderNumber
    );
  }

  hasSameObserversAs(nominationFileRead: NominationFileRead) {
    return _.isEqual(
      this.nominationFileRead.content.observers,
      nominationFileRead.content.observers,
    );
  }

  hasSameRulesAs(nominationFileRead: NominationFileRead): boolean {
    return _.isEqual(
      this.nominationFileRead.content.rules,
      nominationFileRead.content.rules,
    );
  }

  toSnapshot(): NominationFileSnapshot {
    return {
      id: this.id,
      createdAt: this.createdAt,
      rowNumber: this.nominationFileRead.rowNumber,
      content: this.nominationFileRead.content,
    };
  }

  static fromSnapshot(snapshot: NominationFileSnapshot): NominationFileModel {
    return new NominationFileModel(snapshot.id, snapshot.createdAt, {
      rowNumber: snapshot.rowNumber,
      content: snapshot.content,
    });
  }
}
