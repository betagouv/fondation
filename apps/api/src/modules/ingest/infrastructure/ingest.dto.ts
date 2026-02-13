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
