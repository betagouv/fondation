import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { dateOnlyJsonSchema } from 'shared-models';

import { NominationFileOutcome } from '../../domain/nomination-file-outcome';
import { createSortableDto } from 'src/modules/framework/sorting';
import { PriorityEnum } from 'src/modules/shared/priority.enum';
import { timeOnlySchema } from 'src/utils/time-only';

export class AffectReportersDto extends createZodDto(
  z.object({
    items: z.array(
      z
        .object({
          nominationFileId: z.uuid(),
          priorities: z.array(z.enum(PriorityEnum)).optional(),
          priority: z
            .enum(PriorityEnum)
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
            priorities: z.array(z.enum(PriorityEnum)),
            reporterIds: z.array(z.uuid()),
          }),
        ),
    ),
  }),
) {}

function toNullableArray(value: unknown): undefined | unknown[] {
  if (value === undefined) return undefined;
  return ([] as unknown[]).concat(value);
}

export class ListNominationFilesQueryDto extends createSortableDto(
  z.object({
    sortBy: z.enum(['fileNumber', 'name', 'targetedPosition', 'targetedGrade']).optional(),

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
        (x) => (x === undefined ? x : ([] as unknown[]).concat(x)),
        z.array(z.enum([...Object.values(PriorityEnum), 'null'])).optional(),
      )
      .optional()
      .transform((x) => (x === undefined ? x : x.map((y) => (y === 'null' ? null : (y as PriorityEnum))))),

    reporterIds: z
      .preprocess(
        (x) => toNullableArray(x)?.map((val) => (val === 'null' ? null : val)),
        z.array(z.uuid().nullable()).optional(),
      )
      .optional(),

    search: z
      .string()
      .trim()
      .optional()
      .transform((x) => x || undefined),
  }),
) {}

export class UpdateCommentDto extends createZodDto(
  z.object({
    comment: z.string().max(50000).nullable(),
  }),
) {}

export class UpdateAuditionDateDto extends createZodDto(
  z
    .object({
      auditionDate: dateOnlyJsonSchema.nullable(),
      auditionTime: timeOnlySchema.nullable(),
    })
    .refine(
      ({ auditionDate, auditionTime }) => {
        const bothSet = auditionDate !== null && auditionTime !== null;
        const bothCleared = auditionDate === null && auditionTime === null;
        return bothSet || bothCleared;
      },
      { error: "La date et l'heure d'audition doivent être renseignées ensemble" },
    ),
) {}
