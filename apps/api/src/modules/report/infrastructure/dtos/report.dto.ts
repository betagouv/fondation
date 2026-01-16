import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { NominationFile, ReportFileUsage } from 'shared-models';

import { FILE_MIME_TYPES } from 'src/modules/framework/files';

export class AttachReportFileDto extends createZodDto(
  z.object({ files: z.array(z.file()) }),
) {}

export class AttachReportFileQueryDto extends createZodDto(
  z.object({ usage: z.enum(ReportFileUsage) }),
) {}

export class DetachReportFilesQueryDto extends createZodDto(
  z.object({
    fileNames: z
      .union([z.string(), z.array(z.string())])
      .transform((x) => ([] as string[]).concat(x)),
  }),
) {}

export class GetReportFileUrlsQueryDto extends createZodDto(
  z.object({
    fileNames: z
      .union([
        z.string(),
        z
          .array(z.string())
          .max(30, { error: `Impossible d'afficher plus de 30 fichiers` }),
      ])
      .transform((x) => ([] as string[]).concat(x)),
  }),
) {}

export class UpdateReportDto extends createZodDto(
  z.object({
    comment: z.string().optional(),
    status: z.enum(NominationFile.ReportState).optional(),
  }),
) {}

export class UpdateReportRuleValidationDto extends createZodDto(
  z.object({
    isValidated: z.boolean(),
  }),
) {}

export class AttachScreenshotsDto extends createZodDto(
  z.object({
    files: z.array(
      z
        .file()
        .mime([
          FILE_MIME_TYPES.jpg,
          FILE_MIME_TYPES.png,
          FILE_MIME_TYPES.gif,
          FILE_MIME_TYPES.webp,
          FILE_MIME_TYPES.heic,
        ]),
    ),
  }),
) {}

export class AttachedScreenshotsDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({ id: z.string(), name: z.string(), url: z.string() }),
    ),
  }),
) {}
