import { createZodDto } from 'nestjs-zod';
import { Magistrat } from 'shared-models';
import { FILE_MIME_TYPES } from 'src/modules/framework/files';
import { DateOnly } from 'src/utils/date-only';
import z from 'zod';

const ImportNominationSessionFromLodamMetaSchema = z.object({
  form: z.object({
    name: z.string().trim().nonempty(),
    formation: z.enum(Magistrat.Formation),
    date: z.iso.date().transform((x) => DateOnly.fromString(x, 'yyyy-MM-dd')),
    observationClosingDate: z.iso
      .date()
      .transform((x) => DateOnly.fromString(x, 'yyyy-MM-dd')),
    dueDate: z.iso
      .date()
      .transform((x) => DateOnly.fromString(x, 'yyyy-MM-dd'))
      .nullish(),
    positionStartDate: z.iso
      .date()
      .transform((x) => DateOnly.fromString(x, 'yyyy-MM-dd'))
      .nullish(),
  }),
});

export const ImportNominationSessionFromLodamXlsxDtoSchema =
  ImportNominationSessionFromLodamMetaSchema.extend({
    file: z
      .file()
      .mime(FILE_MIME_TYPES.xlsx)
      .max(5 * 1_024 * 1_024 /* 5MB */),
  });

export type ImportNominationSessionFromLodamXlsxDto = z.infer<
  typeof ImportNominationSessionFromLodamXlsxDtoSchema
>;

export class UpdateNominationSessionFilesObserversDto extends createZodDto(
  z.object({
    file: z
      .file()
      .mime(FILE_MIME_TYPES.xlsx)
      .max(5 * 1_024 * 1_024 /* 5MB */),
  }),
) {}

export class UpdateNominationSessionDto extends createZodDto(
  z.object({
    name: z.string(),
    formation: z.enum(Magistrat.Formation),
    date: z.iso.date(),
    observationsClosingDate: z.iso.date(),
    dueDate: z.iso.date().nullable(),
    positionStartDate: z.iso.date().nullable(),
  }),
) {}

export const UploadSessionAttachmentDto = z.object({ file: z.file() });
