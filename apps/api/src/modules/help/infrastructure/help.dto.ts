import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { richPageHtml } from '../../../utils/rich-text-html';
import { ATTACHMENT_MAX_BYTES, FILE_MIME_TYPES, type FileMimeType } from '../../framework/files';

const IMAGE_MIME_TYPES: readonly FileMimeType[] = [
  FILE_MIME_TYPES.gif,
  FILE_MIME_TYPES.heic,
  FILE_MIME_TYPES.jpg,
  FILE_MIME_TYPES.png,
  FILE_MIME_TYPES.webp,
];
const VIDEO_MIME_TYPES: readonly FileMimeType[] = [FILE_MIME_TYPES.mp4, FILE_MIME_TYPES.webm];
const IMAGE_MAX_BYTES = 5 * 1_024 * 1_024;
export const VIDEO_MAX_BYTES = ATTACHMENT_MAX_BYTES;

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
            .mime([...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES])
            .max(VIDEO_MAX_BYTES)
            .refine(
              (file) => VIDEO_MIME_TYPES.includes(file.type as FileMimeType) || file.size <= IMAGE_MAX_BYTES,
              {
                message: `an image weighs ${IMAGE_MAX_BYTES} bytes at most`,
              },
            ),
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
        url: z.url(),
      }),
    ),
  }),
) {}

export class WriteHelpPageContentDto extends createZodDto(z.object({ content: richPageHtml })) {}
