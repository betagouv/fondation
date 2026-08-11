import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { dateOnlyJsonSchema } from 'src/utils/date-only';

export class CreateOrUpdateAgendaDto extends createZodDto(
  z.object({
    sessionMeetingDate: dateOnlyJsonSchema,
    date: dateOnlyJsonSchema,
    chairmanId: z.string(),
    nominationFileIds: z.array(z.string()).nonempty(),
  }),
) {}

export class UpdateAgendaMetadataDto extends createZodDto(
  z.object({
    sessionMeetingDate: dateOnlyJsonSchema,
    date: dateOnlyJsonSchema,
    chairmanId: z.string(),
  }),
) {}

export class UpdateAgendaFilesDto extends createZodDto(
  z.object({ nominationFileIds: z.array(z.string()).nonempty() }),
) {}

export class CreatedAgendaDto extends createZodDto(z.object({ id: z.uuid() })) {}

export class EditAgendaFileBlockDto extends createZodDto(
  z.object({ html: z.string(), outdated: z.boolean() }),
) {}
