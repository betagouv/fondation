import { createZodDto } from 'nestjs-zod';
import { dateOnlyJsonSchema } from 'shared-models';
import { z } from 'zod';

export class CreateOrUpdateAgendaDto extends createZodDto(
  z.object({
    sessionMeetingDate: dateOnlyJsonSchema,
    date: dateOnlyJsonSchema,
    chairmanId: z.string(),
    nominationFileIds: z.array(z.string()).nonempty(),
  }),
) {}

export class CreatedAgendaDto extends createZodDto(
  z.object({ id: z.uuid() }),
) {}

export class FindAgendaNominationFilesQueryDto extends createZodDto(
  z.object({ ignoreAgendaId: z.string().optional() }),
) {}
