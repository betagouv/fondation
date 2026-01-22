import { createZodDto } from 'nestjs-zod';
import { Magistrat } from 'shared-models';
import { FILE_MIME_TYPES } from 'src/modules/framework/files';
import { DateOnly } from 'src/utils/date-only';
import z from 'zod';
import { NominationFileOutcome } from '../../domain/nomination-file-outcome';

const ImportNominationSessionFromLodamXlsxDtoSchema = z.object({
  file: z
    .file()
    .mime(FILE_MIME_TYPES.xlsx)
    .max(5 * 1_024 * 1_024 /* 5MB */),
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

export class ImportNominationSessionFromLodamXlsxDto extends createZodDto(
  ImportNominationSessionFromLodamXlsxDtoSchema,
) {}

export class CreatedNominationSessionDto extends createZodDto(
  z.object({ id: z.string() }),
) {}

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
    date: z.iso.date(),
    observationsClosingDate: z.iso.date(),
    dueDate: z.iso.date().nullable(),
    positionStartDate: z.iso.date().nullable(),
  }),
) {}

export class UploadSessionAttachmentDto extends createZodDto(
  z.object({ file: z.file() }),
) {}

export class ListCommentAccessDto extends createZodDto(
  z.object({ comment: z.string().nullable(), userIds: z.array(z.string()) }),
) {}

export class DefineNominationFileOutcomeDto extends createZodDto(
  z.object({
    outcome: z.enum(NominationFileOutcome.enum).nullable(),
    comment: z.string().trim().nonempty().nullable(),
  }),
) {}

export class CountUnaffectedFilesQueryDto extends createZodDto(
  z.object({
    nominationFileIds: z.codec(
      z.string().optional(),
      z.array(z.uuid()).optional(),
      {
        decode: (str) => str?.split(','),
        encode: (value) => value?.join(','),
      },
    ),
  }),
) {}
