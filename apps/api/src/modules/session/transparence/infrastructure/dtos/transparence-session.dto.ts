import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { DateOnly } from '../../../../../utils/date-only';
import { isDefined } from '../../../../../utils/is-defined';
import { ATTACHMENT_MAX_BYTES, FILE_MIME_TYPES } from '../../../../framework/files';
import { createSortableDto } from '../../../../framework/sorting';
import { FormationEnum } from '../../../../shared/formation.enum';
import { NominationFileAttachmentTypeEnum } from '../../../../shared/nomination-file-attachment-type.enum';
import { NominationFileOutcome } from '../../../../shared/nomination-file-outcome.enum';

const ImportNominationSessionFromLodamXlsxDtoSchema = z.object({
  file: z
    .file()
    .mime(FILE_MIME_TYPES.xlsx)
    .max(5 * 1_024 * 1_024 /* 5MB */),
  form: z.object({
    name: z.string().trim().nonempty(),
    formation: z.enum(FormationEnum),
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

export class WriteSessionCommentDto extends createZodDto(z.object({ comment: z.string().max(50000) })) {}

export class UploadSessionAttachmentsDto extends createZodDto(
  z.object({
    files: z.preprocess((x) => ([] as unknown[]).concat(x), z.array(z.file().max(ATTACHMENT_MAX_BYTES))),
  }),
) {}

export class UploadNominationFileAttachmentsDto extends createZodDto(
  z.object({
    files: z.preprocess((x) => ([] as unknown[]).concat(x), z.array(z.file().max(ATTACHMENT_MAX_BYTES))),
    form: z.object({ type: z.enum(NominationFileAttachmentTypeEnum) }),
  }),
) {}

export class DefineNominationFileOutcomeDto extends createZodDto(
  z.object({
    outcome: z.enum(NominationFileOutcome.enum).nullable(),
    comment: z.string().trim().nonempty().nullable(),
  }),
) {}

export class DefineNominationFilesOutcomeDto extends createZodDto(
  z.object({
    items: z
      .array(
        z.object({
          comment: z.string().trim().nonempty().nullable(),
          nominationFileId: z.uuid(),
        }),
      )
      .nonempty(),
    outcome: z.enum(NominationFileOutcome.enum).nullable(),
  }),
) {}

const ListSessionsFiltersSchema = z.object({
  search: z
    .string()
    .trim()
    .optional()
    .transform((x) => (x?.length === 0 ? undefined : x)),
  formations: z
    .preprocess(
      (x) => (isDefined(x) ? ([] as unknown[]).concat(x) : x),
      z.array(z.enum(FormationEnum)).optional(),
    )
    .optional(),
});

export class ListGdsNominationSessionsQueryDto extends createSortableDto(
  ListSessionsFiltersSchema.extend({ sortBy: z.enum(['date', 'dueDate']).optional() }),
) {}

export class ListArchivedSessionsQueryDto extends createSortableDto(
  ListSessionsFiltersSchema.extend({ sortBy: z.enum(['archivedAt', 'date']).optional() }),
) {}

export class CountUnaffectedFilesQueryDto extends createZodDto(
  z.object({
    nominationFileIds: z.codec(z.string().optional(), z.array(z.uuid()).optional(), {
      decode: (str) => str?.split(','),
      encode: (value) => value?.join(','),
    }),
  }),
) {}
