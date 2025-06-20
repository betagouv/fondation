import { DomainEvent } from 'src/shared-kernel/business-logic/models/domain-event';
import { z } from 'zod';
import { DomainRegistry } from '../../../../transparences/business-logic/models/domain-registry';
import {
  NominationFilesContentWithReporterIds,
  nominationFilesPayloadSchema,
} from './gds-transparence-imported.event';

export type GdsTransparenceNominationFilesAddedEventPayload = {
  transparenceId: string;
  transparenceName: string;
  nominationFiles: NominationFilesContentWithReporterIds[];
};

export const gdsTransparenceNominationFilesAddedEventPayloadSchema = z.object({
  transparenceId: z.string(),
  transparenceName: z.string(),
  nominationFiles: nominationFilesPayloadSchema,
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
