import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { dateOnlyJsonSchema } from 'shared-models';

import { PrismaService } from 'src/modules/framework/database';
import { DateOnly } from 'src/utils/date-only';

@Injectable()
export class DetailsAgendaMetadataQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: { agendaId: string }): Promise<DetailedAgendaMetadata> {
    const agenda = await this.prisma.agenda.findUnique({
      where: { id: query.agendaId },
      select: {
        id: true,
        chairmanId: true,
        date: true,
        sessionMeetingDate: true,
      },
    });

    if (!agenda) throw new NotFoundException();

    return {
      id: agenda.id,
      chairmanId: agenda.chairmanId,
      date: DateOnly.fromDate(agenda.date).toJson(),
      sessionMeetingDate: DateOnly.fromDate(agenda.sessionMeetingDate).toJson(),
    };
  }
}

export class DetailedAgendaMetadata extends createZodDto(
  z.object({
    id: z.string(),
    chairmanId: z.string().nullable(),
    date: dateOnlyJsonSchema,
    sessionMeetingDate: dateOnlyJsonSchema,
  }),
) {}
