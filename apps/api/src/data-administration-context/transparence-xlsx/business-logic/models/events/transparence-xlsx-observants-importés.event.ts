import { DomainEvent } from 'src/shared-kernel/business-logic/models/domain-event';
import { z } from 'zod';
import { DomainRegistry } from '../../../../transparences/business-logic/models/domain-registry';
import {
  NominationFileRead,
  nominationFileReadContentSchema,
} from '../nomination-file-read';

export type TransparenceXlsxObservantsImportésEventPayload = {
  transparenceId: string;
  dossiersDeNominations: Array<{
    dossierId: string;
    observants: NominationFileRead['content']['observers'];
  }>;
};

export const gdsTransparenceNominationFilesModifiedEventPayloadSchema =
  z.object({
    transparenceId: z.string(),
    dossiersDeNominations: z
      .array(
        z.object({
          dossierId: z.string(),
          observants: nominationFileReadContentSchema.shape.observers,
        }),
      )
      .nonempty(),
  }) satisfies z.ZodType<TransparenceXlsxObservantsImportésEventPayload>;

export class TransparenceXlsxObservantsImportésEvent extends DomainEvent<TransparenceXlsxObservantsImportésEventPayload> {
  readonly name = 'TRANSPARENCE_XLSX_OBSERVANTS_IMPORTÉS';

  constructor(
    id: string,
    payload: TransparenceXlsxObservantsImportésEventPayload,
    currentDate: Date,
  ) {
    gdsTransparenceNominationFilesModifiedEventPayloadSchema.parse(payload);
    super(
      id,
      TransparenceXlsxObservantsImportésEvent.name,
      payload,
      currentDate,
    );
  }

  static create(payload: TransparenceXlsxObservantsImportésEventPayload) {
    const id = DomainRegistry.uuidGenerator().generate();
    const currentDate = DomainRegistry.dateTimeProvider().now();
    return new TransparenceXlsxObservantsImportésEvent(
      id,
      payload,
      currentDate,
    );
  }
}
