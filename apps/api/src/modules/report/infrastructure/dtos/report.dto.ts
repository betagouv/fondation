import z from 'zod';
import { createZodDto } from 'nestjs-zod';
import { NominationFile } from 'shared-models';

export const AttachReportFileDto = z.object({ files: z.array(z.file()) });

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
