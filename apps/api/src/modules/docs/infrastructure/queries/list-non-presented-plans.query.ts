import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { dateOnlyJsonSchema } from 'shared-models';

import { PrismaService } from 'src/modules/framework/database';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { DateOnly } from 'src/utils/date-only';
import { dateToTimeOnly, timeOnlySchema } from 'src/utils/time-only';

@Injectable()
export class ListNonPresentedPlansQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(): Promise<ListedNonPresentedPlansDto> {
    const plans = await this.prisma.justicePresentationPlan.findMany({
      select: {
        id: true,
        date: true,
        time: true,
        chairmanLastName: true,
        chairmanFirstName: true,
        agendas: {
          take: 1,
          select: { agenda: { select: { formation: true } } },
        },
      },
      where: {
        html: { not: null },
        isPresented: false,
      },
    });

    return {
      items: plans.flatMap((plan) => {
        if (!plan.agendas[0]?.agenda?.formation) return [];

        const { formation } = plan.agendas[0].agenda;
        return [
          {
            id: plan.id,
            time: dateToTimeOnly(plan.time),
            date: DateOnly.fromDate(plan.date).toJson(),
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
        formation: z.enum(FormationEnum),
        chairman: z.object({ firstName: z.string(), lastName: z.string() }),
      }),
    ),
  }),
) {}
