import { Injectable } from '@nestjs/common';
import z from 'zod';

import { dateOnlyJsonSchema, Magistrat } from 'shared-models';

import { PrismaService } from 'src/modules/framework/database';
import { createPaginatedZodDto, paginate, Pagination } from 'src/modules/framework/pagination';
import { DateOnly } from 'src/utils/date-only';
import { dateToTimeOnly, timeOnlySchema } from 'src/utils/time-only';

@Injectable()
export class ListPresentedPlansQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: { pagination: Pagination }): Promise<ListedPresentedPlansDto> {
    const [totalCount, items] = await this.prisma.$transaction([
      this.prisma.justicePresentationPlan.count({
        where: { isPresented: true },
      }),
      this.prisma.justicePresentationPlan.findMany({
        orderBy: { date: 'desc' },
        take: query.pagination.limit,
        skip: (query.pagination.page - 1) * query.pagination.limit,

        select: {
          id: true,
          date: true,
          time: true,
          agendas: {
            take: 1,
            select: { agenda: { select: { formation: true } } },
          },
        },
        where: {
          pdfId: { not: null },
          isPresented: true,
        },
      }),
    ]);

    return paginate({
      totalCount,
      pagination: query.pagination,
      items: items.map((item) => ({
        ...item,
        time: dateToTimeOnly(item.time),
        date: DateOnly.fromDate(item.date).toJson(),
      })),
    });
  }
}

export class ListedPresentedPlansDto extends createPaginatedZodDto(
  z.object({
    id: z.string(),
    time: timeOnlySchema,
    date: dateOnlyJsonSchema,
    formation: z.enum(Magistrat.Formation),
  }),
) {}
