import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { FILE_MIME_TYPES } from 'src/modules/framework/files';
import { ListedUsersDto } from 'src/modules/simple-auth/infrastructure/queries/list-users.query';
import { isDefined } from 'src/utils/is-defined';

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
          .mime([FILE_MIME_TYPES.jpg, FILE_MIME_TYPES.png, FILE_MIME_TYPES.heic, FILE_MIME_TYPES.webp]),
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
        type: z.string(),
      }),
    ),
  }),
) {}

export class WriteSummaryContentDto extends createZodDto(z.object({ content: z.string() })) {}

export class UpdateSummaryReadersListDto extends createZodDto(z.object({ readerIds: z.array(z.string()) })) {}

export class SearchSummaryReaderDto extends createZodDto(
  z.object({
    search: z.string().min(3).optional(),
    includeIds: z
      .preprocess((x) => (x ? ([] as unknown[]).concat(x) : x), z.array(z.uuidv4()).nonempty().optional())
      .optional(),
  }),
) {}

export class FoundSummaryReadersDto extends ListedUsersDto {}
