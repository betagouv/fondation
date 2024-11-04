import _ from 'lodash';
import { NominationFileRead } from './nomination-file-read';

export type NominationFileSnapshot = {
  id: string;
  createdAt: Date;
  reportId: string | null;
  rowNumber: NominationFileRead['rowNumber'];
  content: NominationFileRead['content'];
};

export type NominationFileUpdatedContent = Pick<
  NominationFileRead['content'],
  'reporters' | 'rules'
>;
export class NominationFileModel {
  constructor(
    private readonly id: string,
    private readonly createdAt: Date,
    private readonly reportId: string | null,
    private nominationFileRead: NominationFileRead,
  ) {}

  updateContent(updatedContent: NominationFileUpdatedContent) {
    this.nominationFileRead.content = {
      ...this.nominationFileRead.content,
      reporters: updatedContent.reporters,
      rules: updatedContent.rules,
    };
  }

  hasSameRowNumberAs(nominationFileRead: NominationFileRead): boolean {
    return this.nominationFileRead.rowNumber === nominationFileRead.rowNumber;
  }

  hasSameReportersAs(nominationFileRead: NominationFileRead) {
    return _.isEqual(
      this.nominationFileRead.content.reporters,
      nominationFileRead.content.reporters,
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
      reportId: this.reportId,
      rowNumber: this.nominationFileRead.rowNumber,
      content: this.nominationFileRead.content,
    };
  }

  static fromSnapshot(snapshot: NominationFileSnapshot): NominationFileModel {
    return new NominationFileModel(
      snapshot.id,
      snapshot.createdAt,
      snapshot.reportId,
      {
        rowNumber: snapshot.rowNumber,
        content: snapshot.content,
      },
    );
  }
}
