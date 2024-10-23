import { DomainEvent } from 'src/shared-kernel/business-logic/models/domainEvent';
import { NominationFileRead } from './nomination-file-read';

export type NominationFilesImportedEventPayload = {
  contents: NominationFileRead['content'][];
};

export class NominationFilesImportedEvent extends DomainEvent<NominationFilesImportedEventPayload> {
  readonly name = 'NOMINATION_FILES_IMPORTED';

  constructor(
    id: string,
    payload: NominationFilesImportedEventPayload,
    currentDate: Date,
  ) {
    super(id, NominationFilesImportedEvent.name, payload, currentDate);
  }
}
