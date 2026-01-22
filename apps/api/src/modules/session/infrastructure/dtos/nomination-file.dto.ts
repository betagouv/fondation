import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { PrioriteEnum } from 'shared-models';

import { createSortableDto } from 'src/modules/framework/sorting';

export class AffectReportersDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        nominationFileId: z.uuid(),
        priority: z.enum(PrioriteEnum).nullable(),
        reporterIds: z.array(z.uuid()),
      }),
    ),
  }),
) {}

export class ListNominationFilesQueryDto extends createSortableDto(
  z.object({
    sortBy: z
      .enum(['fileNumber', 'name', 'targetedPosition', 'targetedGrade'])
      .optional(),
    priorities: z
      .preprocess(
        (x) =>
          x === undefined
            ? undefined
            : ([] as unknown[])
                .concat(x)
                .map((val) => (val === 'null' ? null : val)),
        z.array(z.enum(PrioriteEnum).nullable()).optional(),
      )
      .optional(),
    reporterIds: z
      .preprocess(
        (x) =>
          x === undefined
            ? x
            : ([] as unknown[])
                .concat(x)
                .map((val) => (val === 'null' ? null : val)),
        z.array(z.uuid().nullable()).optional(),
      )
      .optional(),
  }),
) {}

export class UpdateCommentDto extends createZodDto(
  z.object({
    comment: z.string().max(50000).nullable(),
  }),
) {}

export class UpdateCommentAccessDto extends createZodDto(
  z.object({
    userIds: z.array(z.uuid()),
  }),
) {}
