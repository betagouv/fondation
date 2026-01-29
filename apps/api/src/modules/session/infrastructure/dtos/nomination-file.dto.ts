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

function toNullableArray(
  value: unknown | undefined | null,
): undefined | (unknown | null)[] {
  if (value === undefined) return undefined;
  return ([] as unknown[]).concat(value);
}

export class ListNominationFilesQueryDto extends createSortableDto(
  z.object({
    sortBy: z
      .enum(['fileNumber', 'name', 'targetedPosition', 'targetedGrade'])
      .optional(),
    priorities: z
      .preprocess(
        (x) => toNullableArray(x)?.map((val) => (val === 'null' ? null : val)),
        z.array(z.enum(PrioriteEnum).nullable()).optional(),
      )
      .optional(),
    reporterIds: z
      .preprocess(
        (x) => toNullableArray(x)?.map((val) => (val === 'null' ? null : val)),
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
