import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../../generated/prisma/client';
import { dateOnlyJsonSchema } from '../../../../../utils/date-only';
import { DateOnly } from '../../../../../utils/date-only';
import { dateToTimeOnly, timeOnlySchema } from '../../../../../utils/time-only';
import { writerOf, writerSchema } from '../../../../../utils/user.util';
import { Db } from '../../../../framework/database';
import { FormationEnum } from '../../../../shared/formation.enum';
import { prismaFormationEnumToFormationEnum } from '../../../../shared/mappers/formation.mapper';
import { canPresentPlan } from '../../domain/presentation-plan.policies';
import { presentationPlanStatusOf, presentationPlanStatusSchema } from '../presentation-plan-status';

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
        isPresented: true,
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
      } satisfies Prisma.JusticePresentationPlanSelect,
      where: { isPresented: false },
    });

    return {
      items: plans.flatMap((plan) => {
        if (!plan.agendas[0]?.agenda?.formation) return [];

        const { formation } = plan.agendas[0].agenda;
        const status = presentationPlanStatusOf(plan);
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
            status,
            canPresent: canPresentPlan({
              isPresented: plan.isPresented,
              isValidated: status === 'VALIDATED',
            }),
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
        canPresent: z.boolean(),
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
