import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { presentationPlanStatusOf, presentationPlanStatusSchema } from '../presentation-plan-status';
import { fullname } from 'src/modules/docs/shared/infrastructure/services/renderers/helpers';
import { Db } from 'src/modules/framework/database';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { dateOnlyJsonSchema } from 'src/utils/date-only';
import { DateOnly } from 'src/utils/date-only';
import { dateToTimeOnly, timeOnlySchema } from 'src/utils/time-only';

const writerSchema = z.object({ id: z.string(), name: z.string() }).nullable();

@Injectable()
export class ListNonPresentedPlansQuery {
  constructor(private readonly db: Db) {}

  async handle(): Promise<ListedNonPresentedPlansDto> {
    const plans = await this.db.tx.justicePresentationPlan.findMany({
      select: {
        id: true,
        date: true,
        time: true,
        outdated: true,
        pdfId: true,
        createdAt: true,
        updatedAt: true,
        author: { select: { id: true, firstName: true, lastName: true } },
        editor: { select: { id: true, firstName: true, lastName: true } },
        chairmanLastName: true,
        chairmanFirstName: true,
        agendas: {
          take: 1,
          select: { agenda: { select: { formation: true } } },
        },
        removedAgendas: { take: 1, select: { agendaId: true } },
      },
      where: { isPresented: false },
    });

    return {
      items: plans.flatMap((plan) => {
        if (!plan.agendas[0]?.agenda?.formation) return [];

        const { formation } = plan.agendas[0].agenda;
        return [
          {
            id: plan.id,
            time: dateToTimeOnly(plan.time),
            date: DateOnly.fromUtcDate(plan.date).toJson(),
            outdated: plan.outdated,
            hasRemovedAgendas: plan.removedAgendas.length > 0,
            createdAt: plan.createdAt.toISOString(),
            createdBy: writerOf(plan.author),
            updatedAt: plan.updatedAt?.toISOString() ?? null,
            updatedBy: writerOf(plan.editor),
            status: presentationPlanStatusOf(plan),
            formation: prismaFormationEnumToFormationEnum(formation),
            chairman: { firstName: plan.chairmanFirstName, lastName: plan.chairmanLastName },
          },
        ];
      }),
    };
  }
}

export class ListedNonPresentedPlansDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        id: z.string(),
        time: timeOnlySchema,
        date: dateOnlyJsonSchema,
        outdated: z.boolean(),
        hasRemovedAgendas: z.boolean(),
        status: presentationPlanStatusSchema,
        createdAt: z.iso.datetime(),
        createdBy: writerSchema,
        updatedAt: z.iso.datetime().nullable(),
        updatedBy: writerSchema,
        formation: z.enum(FormationEnum),
        chairman: z.object({ firstName: z.string(), lastName: z.string() }),
      }),
    ),
  }),
) {}

function writerOf(user: { id: string; firstName: string; lastName: string } | null) {
  return user ? { id: user.id, name: fullname(user) } : null;
}
