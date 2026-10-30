import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { richTextHtml } from '../../../../utils/rich-text-html';
import { FILE_MIME_TYPES } from '../../../framework/files';

export class WriteMemberCommentDto extends createZodDto(
  z.object({
    comment: richTextHtml,
  }),
) {}

export class AttachMemberCommentScreenshotsDto extends createZodDto(
  // hack for the openapi schema, and keep the content-type validation
  z.object({
    files: z.array(z.file()).pipe(
      z.array(
        z
          .file()
          .max(5 * 1_024 * 1_024)
          .mime([
            FILE_MIME_TYPES.jpg,
            FILE_MIME_TYPES.png,
            FILE_MIME_TYPES.gif,
            FILE_MIME_TYPES.webp,
            FILE_MIME_TYPES.heic,
          ]),
      ),
    ),
  }),
) {}

export class AttachedMemberCommentScreenshotsDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        url: z.string(),
      }),
    ),
  }),
) {}
