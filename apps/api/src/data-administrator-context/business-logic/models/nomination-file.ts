import {
  NominationFilesImportedEvent,
  NominationFilesImportedEventPayload,
} from './nomination-file-imported.event';
import { NominationFileRead } from './nomination-file-read';

export type NominationFileSnapshot = {
  id: string;
  createdAt: Date;
  reportId: string | null;
  rowNumber: NominationFileRead['rowNumber'];
  content: NominationFileRead['content'];
};

export class NominationFileModel {
  constructor(
    private readonly id: string,
    private readonly createdAt: Date,
    private readonly reportId: string | null,
    private readonly nominationFileRead: NominationFileRead,
  ) {}

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

  static fromReadFile(
    generatedUuid: () => string,
    contentRead: NominationFileRead[],
    currentDate: Date,
  ): [NominationFileModel[], NominationFilesImportedEvent] {
    const nominationFiles = contentRead.map(
      (content) =>
        new NominationFileModel(generatedUuid(), currentDate, null, content),
    );

    const payload: NominationFilesImportedEventPayload = nominationFiles.map(
      (nominationFile) => {
        const nominationFileSnapshot = nominationFile.toSnapshot();
        return {
          nominationFileImportedId: nominationFileSnapshot.id,
          content: nominationFileSnapshot.content,
        };
      },
    );

    const nominationFilesImportedEvent = new NominationFilesImportedEvent(
      generatedUuid(),
      payload,
      currentDate,
    );

    return [nominationFiles, nominationFilesImportedEvent];
  }
}
