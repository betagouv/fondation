import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Magistrat } from 'shared-models';

import { NominationFileOutcome } from '../../domain/nomination-file-outcome';
import { FILE_MIME_TYPES } from 'src/modules/framework/files';
import { createSortableDto } from 'src/modules/framework/sorting';
import { DateOnly } from 'src/utils/date-only';
import { isDefined } from 'src/utils/is-defined';

const ImportNominationSessionFromLodamXlsxDtoSchema = z.object({
  file: z
    .file()
    .mime(FILE_MIME_TYPES.xlsx)
    .max(5 * 1_024 * 1_024 /* 5MB */),
  form: z.object({
    name: z.string().trim().nonempty(),
    formation: z.enum(Magistrat.Formation),
    date: z.iso.date().transform((x) => DateOnly.fromString(x, 'yyyy-MM-dd')),
    observationClosingDate: z.iso.date().transform((x) => DateOnly.fromString(x, 'yyyy-MM-dd')),
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

export class CreatedNominationSessionDto extends createZodDto(z.object({ id: z.string() })) {}

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

/** @deprecated */
export class UploadSessionAttachmentDto extends createZodDto(z.object({ file: z.file() })) {}

export class UploadSessionAttachmentsDto extends createZodDto(
  z.object({
    files: z.preprocess((x) => ([] as unknown[]).concat(x), z.array(z.file())),
  }),
) {}

export class DefineNominationFileOutcomeDto extends createZodDto(
  z.object({
    outcome: z.enum(NominationFileOutcome.enum).nullable(),
    comment: z.string().trim().nonempty().nullable(),
  }),
) {}

export class ListGdsNominationSessionsQueryDto extends createSortableDto(
  z.object({
    search: z
      .string()
      .trim()
      .optional()
      .transform((x) => (x?.length === 0 ? undefined : x)),
    sortBy: z.enum(['date', 'dueDate']).optional(),
    formations: z
      .preprocess(
        (x) => (isDefined(x) ? ([] as unknown[]).concat(x) : x),
        z.array(z.enum(Magistrat.Formation)).optional(),
      )
      .optional(),
  }),
) {}

export class CountUnaffectedFilesQueryDto extends createZodDto(
  z.object({
    nominationFileIds: z.codec(z.string().optional(), z.array(z.uuid()).optional(), {
      decode: (str) => str?.split(','),
      encode: (value) => value?.join(','),
    }),
  }),
) {}
