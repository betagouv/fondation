import { createZodDto } from 'nestjs-zod';
import { dateOnlyJsonSchema } from 'shared-models';
import { timeOnlySchema } from 'src/utils/time-only';
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

export class CreatedOfficialReportDto extends createZodDto(
  z.object({ id: z.uuid() }),
) {}

export class CreateOfficialReportDto extends createZodDto(
  z.object({
    sessionMeetingDate: dateOnlyJsonSchema,
    sessionMeetingTime: timeOnlySchema,
    hasRenunciation: z.boolean(),
    justiceDepartmentContactId: z.coerce.number().int().gt(0),
    chairmanId: z.uuid(),
    secretaryId: z.uuid(),
    agendas: z.array(z.uuid()).nonempty(),
    members: z.array(z.uuid()).nonempty(),
  }),
) {}
