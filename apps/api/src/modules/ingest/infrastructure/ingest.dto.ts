import { createZodDto } from 'nestjs-zod';
import { FILE_MIME_TYPES } from 'src/modules/framework/files';
import z from 'zod';

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
            type: z.literal('LolfiHashError'),
            message: z.string(),
            expected: z.string().optional(),
            computed: z.string(),
            file: z.string(),
          }),
          z.object({
            type: z.literal('LolfiMissingFileError'),
            message: z.string(),
            missingFile: z.string(),
          }),
        ]),
      )
      .optional(),
  }),
) {}
