import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { PrioriteEnum } from 'shared-models';

import { createSortableDto } from 'src/modules/framework/sorting';
import { NominationFileOutcome } from '../../domain/nomination-file-outcome';

export class AffectReportersDto extends createZodDto(
  z.object({
    items: z.array(
      z
        .object({
          nominationFileId: z.uuid(),
          priorities: z.array(z.enum(PrioriteEnum)).optional(),
          priority: z
            .enum(PrioriteEnum)
            .nullish()
            .meta({ deprecated: true, description: 'prefer priorities' }),
          reporterIds: z.array(z.uuid()),
        })
        .transform(({ priorities, priority, ...dto }) => {
          if (!priorities && priority) {
            return { ...dto, priorities: [priority] };
          } else if (!priorities && priority === null) {
            return { ...dto, priorities: [] };
          }

          return { priorities, ...dto };
        })
        .pipe(
          z.object({
            nominationFileId: z.uuid(),
            priorities: z.array(z.enum(PrioriteEnum)),
            reporterIds: z.array(z.uuid()),
          }),
        ),
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

    outcomes: z
      .string()
      .optional()
      .meta({ example: `null,VALIDATED` })
      .transform((x) =>
        (x ?? '').split(',').flatMap((x) => {
          const trimmed = x.trim();
          if (trimmed === 'null') return [null];
          if (trimmed) return [trimmed];
          return [];
        }),
      )
      .pipe(z.array(z.enum(NominationFileOutcome.enum).nullable())),

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
