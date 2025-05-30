import { Transparency } from 'shared-models';
import { DomainEvent } from 'src/shared-kernel/business-logic/models/domain-event';
import { z } from 'zod';
import { DomainRegistry } from '../../../../transparences/business-logic/models/domain-registry';
import {
  nominationFileReadContentSchema,
  zodGroupRulesPartial,
} from '../nomination-file-read';

export type GdsTransparenceNominationFilesModifiedEventPayload = {
  transparenceId: string;
  transparenceName: Transparency;
  nominationFiles: Array<{
    nominationFileId: string;
    content: z.infer<typeof nominationFileContentUpdateSchema>;
  }>;
};

const nominationFileContentUpdateSchema = nominationFileReadContentSchema
  .pick({
    folderNumber: true,
    observers: true,
    datePassageAuGrade: true,
    datePriseDeFonctionPosteActuel: true,
    informationCarrière: true,
  })
  .extend({
    rules: zodGroupRulesPartial,
  })
  .partial();

export const gdsTransparenceNominationFilesModifiedEventPayloadSchema =
  z.object({
    transparenceId: z.string(),
    transparenceName: z.nativeEnum(Transparency),
    nominationFiles: z
      .array(
        z.object({
          nominationFileId: z.string(),
          content: nominationFileContentUpdateSchema,
        }),
      )
      .nonempty(),
  }) satisfies z.ZodType<GdsTransparenceNominationFilesModifiedEventPayload>;

export class GdsTransparenceNominationFilesModifiedEvent extends DomainEvent<GdsTransparenceNominationFilesModifiedEventPayload> {
  readonly name = 'GDS_TRANSPARENCE_NOMINATION_FILES_MODIFIED';

  constructor(
    id: string,
    payload: GdsTransparenceNominationFilesModifiedEventPayload,
    currentDate: Date,
  ) {
    super(
      id,
      GdsTransparenceNominationFilesModifiedEvent.name,
      payload,
      currentDate,
    );
  }

  static create(payload: GdsTransparenceNominationFilesModifiedEventPayload) {
    const id = DomainRegistry.uuidGenerator().generate();
    const currentDate = DomainRegistry.dateTimeProvider().now();
    return new GdsTransparenceNominationFilesModifiedEvent(
      id,
      payload,
      currentDate,
    );
  }
}
