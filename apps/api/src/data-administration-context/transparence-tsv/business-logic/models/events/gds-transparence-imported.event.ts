import { Magistrat, Transparency } from 'shared-models';
import { DomainEvent } from 'src/shared-kernel/business-logic/models/domain-event';
import { z } from 'zod';
import { DomainRegistry } from '../domain-registry';
import {
  NominationFileRead,
  nominationFileReadContentSchema,
} from '../nomination-file-read';

export type NominationFilesContentWithReporterIds = {
  nominationFileId: string;
  content: Omit<NominationFileRead['content'], 'reporters'> & {
    reporterIds: string[] | null;
  };
};

export type GdsNewTransparenceImportedEventPayload = {
  transparenceId: string;
  transparenceName: Transparency;
  formation: Magistrat.Formation;
  nominationFiles: NominationFilesContentWithReporterIds[];
};

export const nominationFilesPayloadSchema = z
  .array(
    z.object({
      nominationFileId: z.string(),
      content: nominationFileReadContentSchema
        .omit({ reporters: true })
        .extend({
          reporterIds: z.array(z.string()).nullable(),
        }),
    }),
  )
  .nonempty();

export const gdsNewTransparenceImportedEventPayloadSchema = z.object({
  transparenceId: z.string(),
  transparenceName: z.nativeEnum(Transparency),
  formation: z.nativeEnum(Magistrat.Formation),
  nominationFiles: nominationFilesPayloadSchema,
}) satisfies z.ZodType<GdsNewTransparenceImportedEventPayload>;

export class GdsNewTransparenceImportedEvent extends DomainEvent<GdsNewTransparenceImportedEventPayload> {
  readonly name = 'GDS_NEW_TRANSPARENCE_IMPORTED';

  constructor(
    id: string,
    payload: GdsNewTransparenceImportedEventPayload,
    currentDate: Date,
  ) {
    gdsNewTransparenceImportedEventPayloadSchema.parse(payload);
    super(id, GdsNewTransparenceImportedEvent.name, payload, currentDate);
  }

  static create(payload: GdsNewTransparenceImportedEventPayload) {
    const id = DomainRegistry.uuidGenerator().generate();
    const currentDate = DomainRegistry.dateTimeProvider().now();
    return new GdsNewTransparenceImportedEvent(id, payload, currentDate);
  }
}
