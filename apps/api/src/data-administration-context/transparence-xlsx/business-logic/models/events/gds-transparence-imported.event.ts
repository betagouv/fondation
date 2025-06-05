import { DateOnlyJson, Magistrat } from 'shared-models';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { DomainEvent } from 'src/shared-kernel/business-logic/models/domain-event';
import { z } from 'zod';
import { DomainRegistry } from '../../../../transparences/business-logic/models/domain-registry';
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
  transparenceName: string;
  formation: Magistrat.Formation;
  dateEchéance: DateOnlyJson;
  dateTransparence: DateOnlyJson;
  dateClôtureDélaiObservation: DateOnlyJson | null;
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
  transparenceId: z.string().uuid(),
  transparenceName: z.string(),
  formation: z.nativeEnum(Magistrat.Formation),
  dateEchéance: DateOnly.ZOD_JSON_SCHEMA,
  dateTransparence: DateOnly.ZOD_JSON_SCHEMA,
  dateClôtureDélaiObservation: DateOnly.ZOD_JSON_SCHEMA.nullable(),
  nominationFiles: nominationFilesPayloadSchema,
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
