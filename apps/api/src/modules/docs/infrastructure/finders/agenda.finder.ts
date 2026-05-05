import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { dateOnlyJsonSchema, Magistrat } from 'shared-models';

import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';
import {
  formationEnumToPrismaFormationEnum,
  prismaFormationEnumToFormationEnum,
} from 'src/modules/shared/mappers/formation.mapper';
import { DateOnly } from 'src/utils/date-only';

@Injectable()
export class AgendaFinder {
  private readonly logger = new Logger(AgendaFinder.name);

  constructor(private readonly prisma: PrismaService) {}

  async findNonIncludedInOfficialReport(query: {
    ids?: Set<string>;
    sessionId?: string;
    formation?: Magistrat.Formation;
    ignoreOfficialReportId?: string;
  }): Promise<FoundAgendasDto> {
    return this.find(
      {
        sessionId: query.sessionId,
        id: { in: query.ids ? Array.from(query.ids) : undefined },
        OR: [
          { officialReport: null },
          { officialReportId: query.ignoreOfficialReportId },
        ],
        formation: query.formation
          ? formationEnumToPrismaFormationEnum(query.formation)
          : undefined,
      },
      query.ids,
    );
  }

  async findNonIncludedInPresentationPlan(query: {
    ids?: Set<string>;
    ignorePlanId?: string;
  }): Promise<FoundAgendasDto> {
    return this.find(
      {
        id: { in: query.ids ? Array.from(query.ids) : undefined },
        OR: [
          { justicePresentationPlanId: null },
          { justicePresentationPlanId: query.ignorePlanId },
        ],
      },
      query.ids,
    );
  }

  private async find(
    where: Prisma.AgendaWhereInput,
    ids?: Set<string>,
  ): Promise<FoundAgendasDto> {
    const size = ids?.size ?? 0;
    if (size > 32_000) {
      this.logger.error(`${size} params provided, max 32,000`);
      throw new InternalServerErrorException();
    }

    const items = await this.prisma.agenda.findMany({
      where,
      orderBy: { date: 'asc' },
      select: {
        id: true,
        date: true,
        formation: true,
        sessionId: true,
        chairmanId: true,
        sessionName: true,
        sessionMeetingDate: true,
      },
    });

    if (ids && items.length !== ids.size) {
      const found = new Set(items.map(({ id }) => id));
      const missing = ids.difference(found);

      this.logger.warn(`Agendas not found: ${Array.from(missing).join(', ')}`);
    }

    return {
      items: items.map((item) => ({
        id: item.id,
        chairmanId: item.chairmanId,
        date: DateOnly.fromDate(item.date).toJson(),
        session: { id: item.sessionId, name: item.sessionName },
        formation: prismaFormationEnumToFormationEnum(item.formation),
        sessionMeetingDate: DateOnly.fromDate(item.sessionMeetingDate).toJson(),
      })),
    };
  }
}

export class FoundAgendasDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        id: z.string(),
        date: dateOnlyJsonSchema,
        sessionMeetingDate: dateOnlyJsonSchema,
        formation: z.enum(Magistrat.Formation),
        chairmanId: z.string().nullable(),
        session: z.object({ id: z.string().nullable(), name: z.string() }),
      }),
    ),
  }),
) {}
