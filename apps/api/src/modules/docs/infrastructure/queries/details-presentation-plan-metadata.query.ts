import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { dateOnlyJsonSchema } from 'shared-models';

import { PrismaService } from 'src/modules/framework/database';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { DateOnly } from 'src/utils/date-only';
import { assertIsDefined } from 'src/utils/is-defined';
import { dateToTimeOnly, timeOnlySchema } from 'src/utils/time-only';

@Injectable()
export class DetailsPresentationPlanMetadataQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: { id: string }): Promise<DetailedPresentationPlanMetadataDto> {
    const plan = await this.prisma.justicePresentationPlan.findUnique({
      where: { id: query.id },
      select: {
        id: true,
        chairmanId: true,
        secretaryId: true,
        date: true,
        time: true,
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
      },
    });

    if (!plan) throw new NotFoundException();

    return {
      id: plan.id,
      chairmanId: plan.chairmanId,
      secretaryId: plan.secretaryId,
      isPresented: plan.isPresented,
      isManuallyEdited: plan.isManuallyEdited,
      hasRenunciation: plan.hasRenunciation,
      date: DateOnly.fromDate(plan.date).toJson(),
      time: dateToTimeOnly(plan.time),
      formation: prismaFormationEnumToFormationEnum(assertIsDefined(plan.agendas[0]).agenda.formation),
      agendas: plan.agendas.map(({ agendaId, comment }) => ({
        comment,
        id: agendaId,
      })),
      justiceDepartmentContactId: plan.justiceDepartmentContactId?.toString() ?? null,
      absentMemberIds: plan.members.filter((m) => m.isAbsent).map((m) => m.memberId),
    };
  }
}

export class DetailedPresentationPlanMetadataDto extends createZodDto(
  z.object({
    id: z.string(),
    time: timeOnlySchema,
    date: dateOnlyJsonSchema,
    isPresented: z.boolean(),
    isManuallyEdited: z.boolean(),
    formation: z.enum(FormationEnum),
    agendas: z.array(z.object({ id: z.string(), comment: z.string().nullable() })),
    chairmanId: z.string().nullable(),
    secretaryId: z.string().nullable(),
    justiceDepartmentContactId: z.string().nullable(),
    hasRenunciation: z.boolean(),
    absentMemberIds: z.array(z.string()),
  }),
) {}
