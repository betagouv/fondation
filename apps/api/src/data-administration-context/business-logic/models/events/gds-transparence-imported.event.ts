import { Magistrat } from 'shared-models';
import { DomainEvent } from 'src/shared-kernel/business-logic/models/domain-event';
import { z } from 'zod';
import { DomainRegistry } from '../domain-registry';
import {
  NominationFileRead,
  nominationFileReadContentSchema,
} from '../nomination-file-read';

export type GdsNewTransparenceImportedEventPayload = {
  transparenceId: string;
  formations: Magistrat.Formation[];
  nominationFiles: (Omit<NominationFileRead['content'], 'reporters'> & {
    reporterIds: string[] | null;
  })[];
};

export const gdsNewTransparenceImportedEventPayloadSchema = z.object({
  transparenceId: z.string().uuid(),
  formations: z.array(z.nativeEnum(Magistrat.Formation)).nonempty(),
  nominationFiles: z
    .array(
      nominationFileReadContentSchema.omit({ reporters: true }).extend({
        reporterIds: z.array(z.string()).nullable(),
      }),
    )
    .nonempty(),
}) satisfies z.ZodType<GdsNewTransparenceImportedEventPayload>;

export class GdsNewTransparenceImportedEvent extends DomainEvent<GdsNewTransparenceImportedEventPayload> {
  readonly name = 'GDS_NEW_TRANSPARENCE_IMPORTED';

  constructor(
    id: string,
    payload: GdsNewTransparenceImportedEventPayload,
    currentDate: Date,
  ) {
    super(id, GdsNewTransparenceImportedEvent.name, payload, currentDate);
  }

  static create(payload: GdsNewTransparenceImportedEventPayload) {
    const id = DomainRegistry.uuidGenerator().generate();
    const currentDate = DomainRegistry.dateTimeProvider().now();
    return new GdsNewTransparenceImportedEvent(id, payload, currentDate);
  }
}
