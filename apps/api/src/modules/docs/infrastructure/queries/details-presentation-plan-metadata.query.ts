import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { dateOnlyJsonSchema } from 'shared-models';
import { PrismaService } from 'src/modules/framework/database';
import { DateOnly } from 'src/utils/date-only';
import { dateToTimeOnly, timeOnlySchema } from 'src/utils/time-only';
import z from 'zod';

@Injectable()
export class DetailsPresentationPlanMetadataQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    id: string;
  }): Promise<DetailedPresentationPlanMetadataDto> {
    const plan = await this.prisma.justicePresentationPlan.findUnique({
      where: { id: query.id },
      select: {
        id: true,
        chairmanId: true,
        secretaryId: true,
        date: true,
        time: true,
        isPresented: true,
        justiceDepartmentContactId: true,
        agendas: {
          select: { agendaId: true },
        },
      },
    });

    if (!plan) throw new NotFoundException();

    return {
      id: plan.id,
      chairmanId: plan.chairmanId,
      secretaryId: plan.secretaryId,
      isPresented: plan.isPresented,
      date: DateOnly.fromDate(plan.date).toJson(),
      time: dateToTimeOnly(plan.time),
      agendas: plan.agendas.map(({ agendaId }) => agendaId),
      justiceDepartmentContactId:
        plan.justiceDepartmentContactId?.toString() ?? null,
    };
  }
}

export class DetailedPresentationPlanMetadataDto extends createZodDto(
  z.object({
    id: z.string(),
    time: timeOnlySchema,
    date: dateOnlyJsonSchema,
    isPresented: z.boolean(),
    agendas: z.array(z.string()),
    chairmanId: z.string().nullable(),
    secretaryId: z.string().nullable(),
    justiceDepartmentContactId: z.string().nullable(),
  }),
) {}
