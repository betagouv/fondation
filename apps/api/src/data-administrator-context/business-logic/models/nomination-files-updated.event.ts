import { DomainEvent } from 'src/shared-kernel/business-logic/models/domainEvent';
import { NominationFileRead } from './nomination-file-read';

export type NominationFilesUpdatedEventPayload = {
  nominationFileId: string;
  content: Partial<Pick<NominationFileRead['content'], 'rules'>>;
}[];

export class NominationFilesUpdatedEvent extends DomainEvent<NominationFilesUpdatedEventPayload> {
  readonly name = 'NOMINATION_FILES_UPDATED';

  constructor(
    id: string,
    payload: NominationFilesUpdatedEventPayload,
    currentDate: Date,
  ) {
    super(id, NominationFilesUpdatedEvent.name, payload, currentDate);
  }
}
