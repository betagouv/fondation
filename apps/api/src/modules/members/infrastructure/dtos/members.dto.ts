import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { NominationFile, PrioriteEnum } from 'shared-models';

import { createSortableDto } from 'src/modules/framework/sorting';
import { isDefined } from 'src/utils/is-defined';

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

export class WriteNominationFileMemberMemoDto extends createZodDto(z.object({ memo: z.string() })) {}

export class DetailsMemberSessionQueryDto extends createSortableDto(
  z.object({
    sortBy: z.enum(['fileNumber', 'name', 'targetedPosition', 'targetedGrade']).optional(),

    priorities: z
      .string()
      .optional()
      .transform((x) =>
        (x ?? '').split(',').flatMap((x) => {
          const trimmed = x.trim();
          if (trimmed === 'null') return [null];
          if (trimmed) return [trimmed];
          return [];
        }),
      )
      .pipe(z.array(z.enum(PrioriteEnum).nullable())),

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
