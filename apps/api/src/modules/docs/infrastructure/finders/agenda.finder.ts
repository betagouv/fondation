import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import {
  formationEnumToPrismaFormationEnum,
  prismaFormationEnumToFormationEnum,
} from 'src/modules/shared/mappers/formation.mapper';
import { TypeDeSaisineEnum } from 'src/modules/shared/type-de-saisine.enum';
import { dateOnlyJsonSchema } from 'src/utils/date-only';
import { DateOnly } from 'src/utils/date-only';
import { dateToTimeOnly, timeOnlySchema } from 'src/utils/time-only';

@Injectable()
export class AgendaFinder {
  private readonly logger = new Logger(AgendaFinder.name);

  constructor(private readonly prisma: PrismaService) {}

  async findNonIncludedInOfficialReport(query: {
    ids?: Set<string>;
    sessionId?: string;
    formation?: FormationEnum;
    ignoreOfficialReportId?: string;
    tx?: Prisma.TransactionClient;
  }): Promise<FoundAgendasDto> {
    return this.find(
      {
        sessionId: query.sessionId,
        id: { in: query.ids ? Array.from(query.ids) : undefined },
        OR: [{ officialReport: null }, { officialReportId: query.ignoreOfficialReportId }],
        formation: query.formation ? formationEnumToPrismaFormationEnum(query.formation) : undefined,
      },
      query.ids,
      query.tx,
    );
  }

  async findNonIncludedInPresentationPlan(query: {
    ids?: Set<string>;
    ignorePlanId?: string;
    tx?: Prisma.TransactionClient;
  }): Promise<FoundAgendasDto> {
    return this.find(
      {
        id: { in: query.ids ? Array.from(query.ids) : undefined },
        OR: [{ justicePresentationPlanId: null }, { justicePresentationPlanId: query.ignorePlanId }],
      },
      query.ids,
      query.tx,
    );
  }

  private async find(
    where: Prisma.AgendaWhereInput,
    ids?: Set<string>,
    tx?: Prisma.TransactionClient,
  ): Promise<FoundAgendasDto> {
    if (!tx) return this.prisma.$transaction((tx) => this.find(where, ids, tx));

    const size = ids?.size ?? 0;
    if (size > 32_000) {
      this.logger.error(`${size} params provided, max 32,000`);
      throw new InternalServerErrorException();
    }

    const items = await tx.agenda.findMany({
      where,
      orderBy: { date: 'asc' },
      select: {
        id: true,
        date: true,
        formation: true,
        sessionId: true,
        chairmanId: true,
        chairmanFirstName: true,
        chairmanLastName: true,
        sessionName: true,
        sessionMeetingDate: true,
        officialReportId: true,
        justicePresentationPlan: {
          select: {
            plan: {
              select: {
                id: true,
                time: true,
                endTime: true,
                secretaryId: true,
                hasRenunciation: true,
                justiceDepartmentContactId: true,
                members: { select: { memberId: true, isAbsent: true } },
              },
            },
          },
        },
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
        /** @deprecated */
        chairmanId: item.chairmanId,

        chairman: {
          id: item.chairmanId,
          lastName: item.chairmanLastName,
          firstName: item.chairmanFirstName,
        },

        date: DateOnly.fromDate(item.date).toJson(),
        session: {
          id: item.sessionId,
          name: item.sessionName,
          typeDeSaisine: 'TRANSPARENCE_GDS',
        },
        formation: prismaFormationEnumToFormationEnum(item.formation),
        sessionMeetingDate: DateOnly.fromDate(item.sessionMeetingDate).toJson(),
        officialReportId: item.officialReportId,
        presentationPlan: item.justicePresentationPlan
          ? {
              id: item.justicePresentationPlan.plan.id,
              startTime: dateToTimeOnly(item.justicePresentationPlan.plan.time),
              endTime: item.justicePresentationPlan.plan.endTime
                ? dateToTimeOnly(item.justicePresentationPlan.plan.endTime)
                : null,
              secretaryId: item.justicePresentationPlan.plan.secretaryId,
              justiceContactId:
                item.justicePresentationPlan.plan.justiceDepartmentContactId?.toString() ?? null,
              absentMembers: item.justicePresentationPlan.plan.members.flatMap((m) =>
                m.isAbsent ? [m.memberId] : [],
              ),
              hasRenunciation: item.justicePresentationPlan.plan.hasRenunciation,
            }
          : null,
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
        formation: z.enum(FormationEnum),
        chairman: z.object({ id: z.string().nullable(), firstName: z.string(), lastName: z.string() }),
        officialReportId: z.string().nullable(),
        session: z.object({ id: z.string(), name: z.string(), typeDeSaisine: z.enum(TypeDeSaisineEnum) }),
        presentationPlan: z
          .object({
            id: z.string(),
            startTime: timeOnlySchema,
            endTime: timeOnlySchema.nullable(),
            hasRenunciation: z.boolean(),
            secretaryId: z.string().nullable(),
            justiceContactId: z.string().nullable(),
            absentMembers: z.array(z.string()),
          })
          .nullable(),
      }),
    ),
  }),
) {}
