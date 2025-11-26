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

export class ListNominationFilesQueryDto extends createZodDto(
  z.looseObject({
    priorities: z.array(z.enum(PrioriteEnum)).optional(),
    reporterIds: z.array(z.uuid()).optional(),
  }),
) {}

export class UpdateCommentDto extends createZodDto(
  z.object({
    comment: z.string().max(50000).nullable(),
  }),
) {}
