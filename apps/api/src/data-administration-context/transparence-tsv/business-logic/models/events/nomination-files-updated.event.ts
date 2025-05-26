import { DomainEvent } from 'src/shared-kernel/business-logic/models/domain-event';
import { z } from 'zod';
import { DomainRegistry } from '../domain-registry';
import {
  nominationFileReadContentSchema,
  zodGroupRulesPartial,
} from '../nomination-file-read';

export type NominationFilesUpdatedEventPayload = z.infer<
  typeof nominationFilesUpdatedEventPayloadSchema
>;

export const nominationFilesUpdatedEventPayloadSchema = z
  .object({
    nominationFileId: z.string(),
    content: nominationFileReadContentSchema
      .pick({
        folderNumber: true,
        observers: true,
      })
      .extend({
        rules: zodGroupRulesPartial,
      })
      .partial(),
  })
  .strict()
  .array();

export class NominationFilesUpdatedEvent extends DomainEvent<NominationFilesUpdatedEventPayload> {
  readonly name = 'NOMINATION_FILES_UPDATED';

  constructor(
    id: string,
    payload: NominationFilesUpdatedEventPayload,
    currentDate: Date,
  ) {
    super(id, NominationFilesUpdatedEvent.name, payload, currentDate);
  }

  static create(payload: NominationFilesUpdatedEventPayload) {
    const id = DomainRegistry.uuidGenerator().generate();
    const currentDate = DomainRegistry.dateTimeProvider().now();
    return new NominationFilesUpdatedEvent(id, payload, currentDate);
  }
}
