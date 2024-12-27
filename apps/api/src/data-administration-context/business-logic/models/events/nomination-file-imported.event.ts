import { DomainEvent } from 'src/shared-kernel/business-logic/models/domain-event';
import { z } from 'zod';
import {
  NominationFileRead,
  nominationFileReadContentSchema,
} from '../nomination-file-read';

export type NominationFilesImportedEventPayload = ({
  content: NominationFileRead['content'];
} & {
  nominationFileImportedId: string;
})[];

export const nominationFilesImportedEventPayloadSchema = z
  .object({
    nominationFileImportedId: z.string(),
    content: nominationFileReadContentSchema,
  })
  .array() satisfies z.ZodType<NominationFilesImportedEventPayload>;

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
