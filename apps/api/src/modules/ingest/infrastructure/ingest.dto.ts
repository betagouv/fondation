import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { FILE_MIME_TYPES } from 'src/modules/framework/files';

export class IngestLolfiArchiveDto extends createZodDto(
  z.object({
    file: z
      .file()
      .max(30 * 1024 * 1024)
      .mime(FILE_MIME_TYPES.zip),
  }),
) {}

export class IngestedLolfiArchiveDto extends createZodDto(
  z.object({
    id: z.number().int().gte(0),
    status: z.enum(['STARTED', 'FAILED']),
    errors: z
      .array(
        z.discriminatedUnion('type', [
          z.object({
            type: z.enum(['LolfiHashError']),
            message: z.string(),
            expected: z.string().optional(),
            computed: z.string(),
            file: z.string(),
          }),
          z.object({
            type: z.enum(['LolfiMissingFileError']),
            message: z.string(),
            missingFile: z.string(),
          }),
          z.object({
            type: z.enum(['Unknown']),
            message: z.string(),
          }),
        ]),
      )
      .optional(),
  }),
) {}
