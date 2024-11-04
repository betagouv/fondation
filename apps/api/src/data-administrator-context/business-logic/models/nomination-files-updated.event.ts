import { DomainEvent } from 'src/shared-kernel/business-logic/models/domainEvent';
import { NominationFileRead } from './nomination-file-read';

export type NominationFilesUpdatedEventPayload = ({
  content: Partial<Pick<NominationFileRead['content'], 'reporters' | 'rules'>>;
} & {
  reportId: string;
})[];

export class NominationFilesUpdatedEvent extends DomainEvent<NominationFilesUpdatedEventPayload> {
  readonly name = 'NOMINATION_FILES_IMPORTED';

  constructor(
    id: string,
    payload: NominationFilesUpdatedEventPayload,
    currentDate: Date,
  ) {
    super(id, NominationFilesUpdatedEvent.name, payload, currentDate);
  }
}
