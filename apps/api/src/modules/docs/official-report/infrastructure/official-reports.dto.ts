import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { DocBlockSchema } from '../domain/official-report-doc-block';
import { dateOnlyJsonSchema } from 'src/utils/date-only';
import { timeOnlySchema } from 'src/utils/time-only';

export class CreatedOfficialReportDto extends createZodDto(z.object({ id: z.uuid() })) {}

const updateOfficialReportDtoSchema = z.object({
  sessionMeetingDate: dateOnlyJsonSchema,
  sessionMeetingTime: timeOnlySchema,
  sessionMeetingEndingTime: timeOnlySchema,
  hasRenunciation: z.boolean(),
  justiceDepartmentContactId: z.string(),
  chairmanId: z.uuid(),
  secretaryId: z.uuid(),
  absentMemberIds: z.array(z.uuid()),
});

const createOfficialReportDtoSchema = updateOfficialReportDtoSchema.extend({ agendas: z.array(z.uuid()) });

export class CreateOfficialReportDto extends createZodDto(createOfficialReportDtoSchema) {}

export class UpdateOfficialReportDto extends createZodDto(updateOfficialReportDtoSchema) {}

export class ListAgendasForNewOfficialReportQueryDto extends createZodDto(
  z.object({
    ignoreOfficialReportId: z.string().optional(),
  }),
) {}

export class DetailedOfficialReportDocumentDto extends createZodDto(
  z.object({ blocks: z.array(DocBlockSchema) }),
) {}

export class EditOfficialReportBlockDto extends createZodDto(
  z.object({ html: z.string(), outdated: z.boolean() }),
) {}

export class EditOfficialReportSectionTitleDto extends createZodDto(z.object({ text: z.string() })) {}

export class EditOfficialReportSectionIntroBlockDto extends createZodDto(z.object({ html: z.string() })) {}
