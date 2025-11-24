import z from 'zod';
import { createZodDto } from 'nestjs-zod';

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
