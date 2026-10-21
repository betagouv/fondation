import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { dateOnlyJsonSchema } from '../../../../utils/date-only';
import { editedHtml } from '../../shared/infrastructure/edited-html';

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
  // an empty list is let through on purpose: the agenda refuses it with its own words, where a
  // schema would answer an unexplained "validation failed"
  z.object({ nominationFileIds: z.array(z.string()) }),
) {}

export class CreatedAgendaDto extends createZodDto(z.object({ id: z.uuid() })) {}

export class EditAgendaFileBlockDto extends createZodDto(
  z.object({ html: editedHtml, outdated: z.boolean() }),
) {}
