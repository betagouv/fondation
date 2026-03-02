import { createZodDto } from 'nestjs-zod';
import { NominationFile } from 'shared-models';
import { createSortableDto } from 'src/modules/framework/sorting';
import { isDefined } from 'src/utils/is-defined';
import z from 'zod';

export class ListMembersQueryDto extends createZodDto(
  z.object({
    sortBy: z.enum(['firstName', 'lastName']).optional(),
    sortDirection: z.enum(['asc', 'desc']).default('asc').optional(),
    search: z.string().trim().optional(),
    formations: z.preprocess(
      (x) => (isDefined(x) ? ([] as unknown[]).concat(x) : x),
      z.array(z.enum(['SIEGE', 'PARQUET', 'COMMUN'])).optional(),
    ),
  }),
) {}

export class WriteNominationFileMemberMemoDto extends createZodDto(
  z.object({ memo: z.string() }),
) {}

export class DetailsMemberSessionQueryDto extends createSortableDto(
  z.object({
    sortBy: z.enum(['number', 'name', 'targetedPosition', 'status']).optional(),
    status: z
      .string()
      .transform((x) =>
        x
          .split(',')
          .map((x) => x.trim())
          .filter((x) => !!x),
      )
      .pipe(z.array(z.enum(NominationFile.ReportState)))
      .nullish(),
  }),
) {}
