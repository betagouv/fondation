import { Transparency } from 'shared-models';
import { DomainEvent } from 'src/shared-kernel/business-logic/models/domain-event';
import { z } from 'zod';
import { DomainRegistry } from '../domain-registry';
import {
  NominationFileRead,
  nominationFileReadContentSchema,
} from '../nomination-file-read';

export type GdsTransparenceNominationFilesAddedEventPayload = {
  transparenceId: string;
  nominationFiles: NominationFileRead['content'][];
};

export const gdsTransparenceNominationFilesAddedEventPayloadSchema = z.object({
  transparenceId: z.nativeEnum(Transparency),
  nominationFiles: z.array(nominationFileReadContentSchema).nonempty(),
}) satisfies z.ZodType<GdsTransparenceNominationFilesAddedEventPayload>;

export class GdsTransparenceNominationFilesAddedEvent extends DomainEvent<GdsTransparenceNominationFilesAddedEventPayload> {
  readonly name = 'GDS_TRANSPARENCE_NOMINATION_FILES_ADDED';

  constructor(
    id: string,
    payload: GdsTransparenceNominationFilesAddedEventPayload,
    currentDate: Date,
  ) {
    super(
      id,
      GdsTransparenceNominationFilesAddedEvent.name,
      payload,
      currentDate,
    );
  }

  static create(payload: GdsTransparenceNominationFilesAddedEventPayload) {
    const id = DomainRegistry.uuidGenerator().generate();
    const currentDate = DomainRegistry.dateTimeProvider().now();
    return new GdsTransparenceNominationFilesAddedEvent(
      id,
      payload,
      currentDate,
    );
  }
}
