import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const fileUrlsQuerySchema = z.object({
  ids: z
    .union([z.string(), z.string().array()])
    .transform((v) => (Array.isArray(v) ? v : [v])),
});

export class FilesUrlsQueryDto extends createZodDto(fileUrlsQuerySchema) {}
