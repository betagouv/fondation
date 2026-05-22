import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { dateOnlyJsonSchema } from 'shared-models';

import { timeOnlySchema } from 'src/utils/time-only';

export class CreateOrUpdateAgendaDto extends createZodDto(
  z.object({
    sessionMeetingDate: dateOnlyJsonSchema,
    date: dateOnlyJsonSchema,
    chairmanId: z.string(),
    nominationFileIds: z.array(z.string()).nonempty(),
  }),
) {}

export class CreatedAgendaDto extends createZodDto(z.object({ id: z.uuid() })) {}

export class FindAgendaNominationFilesQueryDto extends createZodDto(
  z.object({ ignoreAgendaId: z.string().optional() }),
) {}

export class CreatedOfficialReportDto extends createZodDto(z.object({ id: z.uuid() })) {}

export class CreateOrUpdateOfficialReportDto extends createZodDto(
  z.object({
    sessionMeetingDate: dateOnlyJsonSchema,
    sessionMeetingTime: timeOnlySchema,
    sessionMeetingEndingTime: timeOnlySchema,
    hasRenunciation: z.boolean(),
    justiceDepartmentContactId: z.string(),
    chairmanId: z.uuid(),
    secretaryId: z.uuid(),
    agendas: z.array(z.uuid()).nonempty(),
    absentMemberIds: z.array(z.uuid()),
  }),
) {}

export class CreateOfficialReportJusticeContactDto extends createZodDto(
  z.object({
    name: z.string().trim().nonempty(),
  }),
) {}

export class CreatedOfficialReportJusticeContactDto extends createZodDto(
  z.object({
    id: z.string(),
    name: z.string(),
  }),
) {}

export class SearchJusticeContactsQueryDto extends createZodDto(
  z.object({ search: z.string().default('') }),
) {}

export class ListAgendasForNewOfficialReportQueryDto extends createZodDto(
  z.object({
    ignoreOfficialReportId: z.string().optional(),
  }),
) {}

export class CreatedJusticePresentationPlanDto extends createZodDto(z.object({ id: z.string() })) {}

export class CreateOrUpdateJusticePresentationPlanDto extends createZodDto(
  z.object({
    date: dateOnlyJsonSchema,
    time: timeOnlySchema,
    endingTime: timeOnlySchema.nullish(),
    chairmanId: z.string(),
    secretaryId: z.string(),
    justiceContactId: z.string(),
    agendas: z.array(
      z.object({
        id: z.string(),
        comment: z.string().trim().nonempty().nullable(),
      }),
    ),
  }),
) {}

export class PresentPlanDto extends createZodDto(
  z.object({
    endTime: timeOnlySchema,
  }),
) {}

export class UpdateDocumentHtmlDto extends createZodDto(
  z.object({
    html: z.string().min(1),
  }),
) {}
