import { DomainEvent } from 'src/shared-kernel/business-logic/models/domain-event';
import {
  NominationFileRead,
  nominationFileReadContentSchema,
} from '../nomination-file-read';
import { z, ZodType } from 'zod';

export type NominationFilesUpdatedEventPayload = {
  nominationFileId: string;
  content: Partial<
    Pick<NominationFileRead['content'], 'folderNumber' | 'observers' | 'rules'>
  >;
}[];

export const nominationFilesUpdatedEventPayloadSchema = z
  .object({
    nominationFileId: z.string(),
    content: nominationFileReadContentSchema
      .pick({
        folderNumber: true,
        observers: true,
        rules: true,
      })
      .partial(),
  })
  .strict()
  .array() satisfies ZodType<NominationFilesUpdatedEventPayload>;

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
