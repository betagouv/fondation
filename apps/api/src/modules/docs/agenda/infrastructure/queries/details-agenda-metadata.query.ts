import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Db } from 'src/modules/framework/database';
import { dateOnlyJsonSchema } from 'src/utils/date-only';
import { DateOnly } from 'src/utils/date-only';

@Injectable()
export class DetailsAgendaMetadataQuery {
  constructor(private readonly db: Db) {}

  async handle(query: { agendaId: string }): Promise<DetailedAgendaMetadata> {
    const agenda = await this.db.tx.agenda.findUnique({
      where: { id: query.agendaId },
      select: {
        id: true,
        chairmanId: true,
        date: true,
        sessionMeetingDate: true,
        isManuallyEdited: true,
      },
    });

    if (!agenda) throw new NotFoundException();

    return {
      id: agenda.id,
      chairmanId: agenda.chairmanId,
      isManuallyEdited: agenda.isManuallyEdited,
      date: DateOnly.fromUtcDate(agenda.date).toJson(),
      sessionMeetingDate: DateOnly.fromUtcDate(agenda.sessionMeetingDate).toJson(),
    };
  }
}

export class DetailedAgendaMetadata extends createZodDto(
  z.object({
    id: z.string(),
    chairmanId: z.string().nullable(),
    isManuallyEdited: z.boolean(),
    date: dateOnlyJsonSchema,
    sessionMeetingDate: dateOnlyJsonSchema,
  }),
) {}
