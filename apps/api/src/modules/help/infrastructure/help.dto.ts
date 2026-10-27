import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { richTextHtml } from '../../../utils/rich-text-html';
import { FILE_MIME_TYPES } from '../../framework/files';

export class IncludeFilesInHelpPageContentDto extends createZodDto(
  // hack for the openapi schema, and keep the content-type validation
  z.object({
    files: z
      .array(z.file())
      .nonempty()
      .pipe(
        z.array(
          z
            .file()
            .max(5 * 1_024 * 1_024)
            .mime([FILE_MIME_TYPES.jpg, FILE_MIME_TYPES.png, FILE_MIME_TYPES.heic, FILE_MIME_TYPES.webp]),
        ),
      ),
  }),
) {}

export class IncludedFilesInHelpPageContentDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        type: z.string(),
        url: z.url(),
      }),
    ),
  }),
) {}

export class WriteHelpPageContentDto extends createZodDto(z.object({ content: richTextHtml })) {}
