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

export type TransparenceXlsxImportéeEventPayload = {
  transparenceId: string;
  transparenceName: string;
  formation: Magistrat.Formation;
  dateTransparence: DateOnlyJson;
  dateEchéance: DateOnlyJson | null;
  dateClôtureDélaiObservation: DateOnlyJson;
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

export const transparenceXlsxImportéePayloadSchema = z.object({
  transparenceId: z.string().uuid(),
  transparenceName: z.string(),
  formation: z.nativeEnum(Magistrat.Formation),
  dateTransparence: DateOnly.ZOD_JSON_SCHEMA,
  dateEchéance: DateOnly.ZOD_JSON_SCHEMA.nullable(),
  dateClôtureDélaiObservation: DateOnly.ZOD_JSON_SCHEMA,
  nominationFiles: nominationFilesPayloadSchema,
}) satisfies z.ZodType<TransparenceXlsxImportéeEventPayload>;

export class TransparenceXlsxImportéeEvent extends DomainEvent<TransparenceXlsxImportéeEventPayload> {
  readonly name = 'TRANSPARENCE_XLSX_IMPORTEE';

  constructor(
    id: string,
    payload: TransparenceXlsxImportéeEventPayload,
    currentDate: Date,
  ) {
    super(id, TransparenceXlsxImportéeEvent.name, payload, currentDate);
  }

  static create(payload: TransparenceXlsxImportéeEventPayload) {
    const id = DomainRegistry.uuidGenerator().generate();
    const currentDate = DomainRegistry.dateTimeProvider().now();
    return new TransparenceXlsxImportéeEvent(id, payload, currentDate);
  }
}
