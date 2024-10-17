import { DomainEvent } from 'src/shared-kernel/business-logic/models/domainEvent';
import { NominationFileRead } from './nomination-file-read';

export type NominationFilesImportedEventPayload = Record<
  number,
  NominationFileRead
>;

export class NominationFilesImportedEvent extends DomainEvent<NominationFilesImportedEventPayload> {
  constructor(
    id: string,
    payload: NominationFilesImportedEventPayload,
    currentDate: Date,
  ) {
    super(id, 'NOMINATION_FILES_IMPORTED', payload, currentDate);
  }
}
