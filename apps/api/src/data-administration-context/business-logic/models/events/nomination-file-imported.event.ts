import { DomainEvent } from 'src/shared-kernel/business-logic/models/domain-event';
import { NominationFileRead } from '../nomination-file-read';

export type NominationFilesImportedEventPayload = ({
  content: NominationFileRead['content'];
} & {
  nominationFileImportedId: string;
})[];

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
