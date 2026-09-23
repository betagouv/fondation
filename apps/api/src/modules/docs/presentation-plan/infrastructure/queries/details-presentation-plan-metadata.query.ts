import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { presentationPlanStatusOf, presentationPlanStatusSchema } from '../presentation-plan-status';
import { Prisma } from 'src/generated/prisma/client';
import {
  AGENDA_CONTENT_VERSIONS,
  agendaContentOf,
} from 'src/modules/docs/shared/infrastructure/agenda-content';
import { fullname } from 'src/modules/docs/shared/infrastructure/services/renderers/helpers';
import { Db } from 'src/modules/framework/database';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { dateOnlyJsonSchema } from 'src/utils/date-only';
import { DateOnly } from 'src/utils/date-only';
import { assertIsDefined } from 'src/utils/is-defined';
import { dateToTimeOnly, timeOnlySchema } from 'src/utils/time-only';

const chairmanSchema = z.object({ firstName: z.string(), lastName: z.string() });

@Injectable()
export class DetailsPresentationPlanMetadataQuery {
  constructor(private readonly db: Db) {}

  async handle(query: { id: string }): Promise<DetailedPresentationPlanMetadataDto> {
    const plan = await this.db.tx.justicePresentationPlan.findUnique({
      where: { id: query.id },
      select: {
        id: true,
        chairmanId: true,
        secretaryId: true,
        date: true,
        time: true,
        outdated: true,
        pdfId: true,
        isPresented: true,
        isManuallyEdited: true,
        justiceDepartmentContactId: true,
        hasRenunciation: true,
        members: { select: { memberId: true, isAbsent: true } },
        agendas: {
          select: {
            agendaId: true,
            comment: true,
            agenda: { select: { formation: true } },
          },
        },
        removedAgendas: {
          orderBy: { removedAt: 'asc' },
          select: {
            agendaId: true,
            removedAt: true,
            remover: { select: { id: true, firstName: true, lastName: true } },
            agenda: {
              select: {
                versions: {
                  ...AGENDA_CONTENT_VERSIONS,
                  select: {
                    status: true,
                    sessionMeetingDate: true,
                    chairmanFirstName: true,
                    chairmanLastName: true,
                  },
                },
              },
            },
            takenBy: {
              select: { id: true, date: true, time: true, chairmanFirstName: true, chairmanLastName: true },
            },
          },
        },
      } satisfies Prisma.JusticePresentationPlanSelect,
    });

    if (!plan) throw new NotFoundException();

    return {
      id: plan.id,
      chairmanId: plan.chairmanId,
      secretaryId: plan.secretaryId,
      outdated: plan.outdated,
      status: presentationPlanStatusOf(plan),
      isPresented: plan.isPresented,
      isManuallyEdited: plan.isManuallyEdited,
      hasRenunciation: plan.hasRenunciation,
      date: DateOnly.fromUtcDate(plan.date).toJson(),
      time: dateToTimeOnly(plan.time),
      formation: prismaFormationEnumToFormationEnum(assertIsDefined(plan.agendas[0]).agenda.formation),
      agendas: plan.agendas.map(({ agendaId, comment }) => ({
        comment,
        id: agendaId,
      })),
      justiceDepartmentContactId: plan.justiceDepartmentContactId?.toString() ?? null,
      absentMemberIds: plan.members.filter((m) => m.isAbsent).map((m) => m.memberId),
      removedAgendas: plan.removedAgendas.flatMap(({ agenda, agendaId, remover, removedAt, takenBy }) => {
        const content = agendaContentOf(agenda.versions);
        if (!content) return [];

        return [
          {
            agenda: {
              id: agendaId,
              sessionMeetingDate: DateOnly.fromUtcDate(content.sessionMeetingDate).toJson(),
              chairman: { firstName: content.chairmanFirstName, lastName: content.chairmanLastName },
            },
            takenBy: {
              id: takenBy.id,
              date: DateOnly.fromUtcDate(takenBy.date).toJson(),
              time: dateToTimeOnly(takenBy.time),
              chairman: { firstName: takenBy.chairmanFirstName, lastName: takenBy.chairmanLastName },
            },
            removedAt: removedAt.toISOString(),
            removedBy: writerOf(remover),
          },
        ];
      }),
    };
  }
}

export class DetailedPresentationPlanMetadataDto extends createZodDto(
  z.object({
    id: z.string(),
    time: timeOnlySchema,
    date: dateOnlyJsonSchema,
    outdated: z.boolean(),
    status: presentationPlanStatusSchema,
    isPresented: z.boolean(),
    isManuallyEdited: z.boolean(),
    formation: z.enum(FormationEnum),
    agendas: z.array(z.object({ id: z.string(), comment: z.string() })),
    chairmanId: z.string().nullable(),
    secretaryId: z.string().nullable(),
    justiceDepartmentContactId: z.string().nullable(),
    hasRenunciation: z.boolean(),
    absentMemberIds: z.array(z.string()),
    removedAgendas: z.array(
      z.object({
        agenda: z.object({
          id: z.string(),
          sessionMeetingDate: dateOnlyJsonSchema,
          chairman: chairmanSchema,
        }),
        takenBy: z.object({
          id: z.string(),
          date: dateOnlyJsonSchema,
          time: timeOnlySchema,
          chairman: chairmanSchema,
        }),
        removedAt: z.iso.datetime(),
        removedBy: z.object({ id: z.string(), name: z.string() }).nullable(),
      }),
    ),
  }),
) {}

function writerOf(user: { id: string; firstName: string; lastName: string } | null) {
  return user ? { id: user.id, name: fullname(user) } : null;
}
