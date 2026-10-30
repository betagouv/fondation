import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { scheduleAuditionSchema } from '../../../../../utils/audition-schedule';
import { createSortableDto } from '../../../../framework/sorting';
import { NominationFileOutcome } from '../../../../shared/nomination-file-outcome.enum';
import { PriorityEnum } from '../../../../shared/priority.enum';

export class AffectReportersDto extends createZodDto(
  z.object({
    items: z.array(z.object({ nominationFileId: z.uuid(), reporterIds: z.array(z.uuid()) })).nonempty(),
  }),
) {}

export class UpdateNominationFilesPrioritiesDto extends createZodDto(
  z.object({
    items: z
      .array(z.object({ nominationFileId: z.uuid(), priorities: z.array(z.enum(PriorityEnum)) }))
      .nonempty(),
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

    nominationFileIds: z.preprocess(toNullableArray, z.array(z.uuid()).optional()).optional(),

    search: z
      .string()
      .trim()
      .optional()
      .transform((x) => x || undefined),

    missingEvaluation: z.codec(z.union([z.string(), z.boolean()]).optional(), z.boolean().optional(), {
      decode: (x) => (x === undefined ? undefined : x === 'true' || x === true),
      encode: (x) => x?.toString(),
    }),
  }),
) {}

export class UpdateCommentDto extends createZodDto(
  z.object({
    comment: z.string().max(50000).nullable(),
  }),
) {}

export class UpdateMissingEvaluationDto extends createZodDto(
  z.object({
    missingEvaluation: z.boolean(),
  }),
) {}

export class UpdateMissingEvaluationCommentDto extends createZodDto(
  z.object({
    comment: z
      .string()
      .trim()
      .max(150)
      .nullable()
      .transform((x) => x || null),
  }),
) {}

export class UpdateAuditionDateDto extends createZodDto(scheduleAuditionSchema) {}

export class UpdateAuditionRequestDto extends createZodDto(z.object({ requested: z.boolean() })) {}

export class WriteNominationFileMemberMemoDto extends createZodDto(z.object({ memo: z.string() })) {}
