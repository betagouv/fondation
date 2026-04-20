import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { dateOnlyJsonSchema } from 'shared-models';
import { PrismaFormationEnum } from 'src/generated/prisma/enums';
import { PrismaService } from 'src/modules/framework/database';
import { DateOnly } from 'src/utils/date-only';
import { z } from 'zod';

@Injectable()
export class FindAgendasForNewOfficialReportQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    sessionId: string;
    ignoreOfficialReportId?: string;
  }): Promise<FoundAgendasForNewOfficialReportDto> {
    const session = await this.prisma.session.findUnique({
      where: { id: query.sessionId },
      select: { id: true },
    });
    if (!session) throw new NotFoundException();

    const agendas = await this.prisma.agenda.findMany({
      where: query.ignoreOfficialReportId
        ? {
            sessionId: query.sessionId,
            OR: [
              { officialReportId: null },
              { officialReportId: query.ignoreOfficialReportId },
            ],
          }
        : { sessionId: query.sessionId, officialReportId: null },
      select: { id: true, date: true, formation: true },
      orderBy: { date: 'asc' },
    });

    return {
      items: agendas.map((a) => ({
        id: a.id,
        date: DateOnly.fromDate(a.date).toJson(),
        formation: a.formation,
      })),
    };
  }
}

export class FoundAgendasForNewOfficialReportDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        id: z.string(),
        date: dateOnlyJsonSchema,
        formation: z.enum(PrismaFormationEnum),
      }),
    ),
  }),
) {}
