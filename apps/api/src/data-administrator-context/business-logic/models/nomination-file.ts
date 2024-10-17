import { NominationFileRead } from './nomination-file-read';

export type NominationFileSnapshot = {
  id: string;
  reportId: string | null;
  rowNumber: NominationFileRead['rowNumber'];
  content: NominationFileRead['content'];
};

export class NominationFileModel {
  constructor(
    private readonly id: string,
    private readonly reportId: string | null,
    private readonly nominationFileRead: NominationFileRead,
  ) {}

  toSnapshot(): NominationFileSnapshot {
    return {
      id: this.id,
      reportId: this.reportId,
      rowNumber: this.nominationFileRead.rowNumber,
      content: this.nominationFileRead.content,
    };
  }
}
