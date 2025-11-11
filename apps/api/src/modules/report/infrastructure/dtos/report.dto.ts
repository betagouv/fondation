import z from 'zod';
import { createZodDto } from 'nestjs-zod';

export class DetachReportFilesQueryDto extends createZodDto(
  z.object({
    fileNames: z
      .union([z.string(), z.array(z.string())])
      .transform((x) => ([] as string[]).concat(x)),
  }),
) {}
