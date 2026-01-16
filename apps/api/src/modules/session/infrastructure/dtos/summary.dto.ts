import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { isDefined } from 'src/utils/is-defined';
import { FILE_MIME_TYPES } from 'src/modules/framework/files';

export class CreatedSummaryDto extends createZodDto(
  z.object({
    id: z.string(),
  }),
) {}

export class AttachSummaryFilesDto extends createZodDto(
  z.object({
    files: z.array(z.file().max(5 * 1_024 * 1_024)).nonempty(),
  }),
) {}

export class DetachSummaryFilesQueryDto extends createZodDto(
  z.object({
    fileIds: z.preprocess(
      (x) => (isDefined(x) ? ([] as unknown[]).concat(x) : x),
      z.array(z.string()).nonempty(),
    ),
  }),
) {}

export class IncludeFilesInSummaryContentDto extends createZodDto(
  z.object({
    files: z
      .array(
        z
          .file()
          .max(5 * 1_024 * 1_024)
          .mime([
            FILE_MIME_TYPES.jpg,
            FILE_MIME_TYPES.png,
            FILE_MIME_TYPES.heic,
            FILE_MIME_TYPES.webp,
          ]),
      )
      .nonempty(),
  }),
) {}

export class IncludedFilesInSummaryContentDto extends createZodDto(
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

export class WriteSummaryContentDto extends createZodDto(
  z.object({ content: z.string() }),
) {}

export class UpdateSummaryReadersListDto extends createZodDto(
  z.object({ readerIds: z.array(z.string()) }),
) {}
