import { createZodDto } from 'nestjs-zod';
import { PrioriteEnum } from 'shared-models';
import z from 'zod';

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

const SortableNominationFileFields = [
  'nomMagistrat',
  'numeroDeDossier',
  'dateEcheance',
  'priority',
  'grade',
  'gradeCible',
] as const;

export type NominationFileSortField =
  (typeof SortableNominationFileFields)[number];

const toArray = <T>(val: T | T[] | undefined): T[] | undefined =>
  val === undefined ? undefined : Array.isArray(val) ? val : [val];

export class ListNominationFilesQueryDto extends createZodDto(
  z.looseObject({
    priorities: z.preprocess(toArray, z.array(z.enum(PrioriteEnum)).optional()),
    reporterIds: z.preprocess(toArray, z.array(z.uuid()).optional()),
    sortField: z.enum(SortableNominationFileFields).optional(),
    sortDirection: z.enum(['asc', 'desc']).optional(),
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
