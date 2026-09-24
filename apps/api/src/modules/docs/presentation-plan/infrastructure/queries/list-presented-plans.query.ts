import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import z from 'zod';

import { presentationPlanStatusOf, presentationPlanStatusSchema } from '../presentation-plan-status';
import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { createPaginatedZodDto, paginate, Pagination } from 'src/modules/framework/pagination';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { dateOnlyJsonSchema } from 'src/utils/date-only';
import { DateOnly } from 'src/utils/date-only';
import { assertIsDefined } from 'src/utils/is-defined';
import { dateToTimeOnly, timeOnlySchema } from 'src/utils/time-only';
import { fullname } from 'src/utils/user.util';

@Injectable()
export class ListPresentedPlansQuery {
  constructor(private readonly db: Db) {}

  @Transactional()
  async handle(query: { pagination: Pagination }): Promise<ListedPresentedPlansDto> {
    const where = { isPresented: true } satisfies Prisma.JusticePresentationPlanWhereInput;

    const totalCount = await this.db.tx.justicePresentationPlan.count({ where });
    const items = await this.db.tx.justicePresentationPlan.findMany({
      where,
      orderBy: { date: 'desc' },
      take: query.pagination.limit,
      skip: (query.pagination.page - 1) * query.pagination.limit,

      select: {
        id: true,
        date: true,
        time: true,
        endTime: true,
        outdated: true,
        pdfId: true,
        createdAt: true,
        updatedAt: true,
        presentedAt: true,
        author: { select: { id: true, firstName: true, lastName: true } },
        editor: { select: { id: true, firstName: true, lastName: true } },
        presenter: { select: { id: true, firstName: true, lastName: true } },
        chairmanLastName: true,
        chairmanFirstName: true,
        agendas: {
          take: 1,
          select: { agenda: { select: { formation: true } } },
        },
      } satisfies Prisma.JusticePresentationPlanSelect,
    });

    return paginate({
      totalCount,
      pagination: query.pagination,
      items: items.map((item) => ({
        id: item.id,
        time: dateToTimeOnly(item.time),
        endTime: item.endTime ? dateToTimeOnly(item.endTime) : null,
        date: DateOnly.fromUtcDate(item.date).toJson(),
        outdated: item.outdated,
        status: presentationPlanStatusOf(item),
        createdAt: item.createdAt.toISOString(),
        createdBy: writerOf(item.author),
        updatedAt: item.updatedAt?.toISOString() ?? null,
        updatedBy: writerOf(item.editor),
        presentedAt: item.presentedAt?.toISOString() ?? null,
        presentedBy: writerOf(item.presenter),
        formation: prismaFormationEnumToFormationEnum(assertIsDefined(item.agendas[0]).agenda.formation),
        chairman: { firstName: item.chairmanFirstName, lastName: item.chairmanLastName },
      })),
    });
  }
}

const writerSchema = z.object({ id: z.string(), name: z.string() }).nullable();

export class ListedPresentedPlansDto extends createPaginatedZodDto(
  z.object({
    id: z.string(),
    time: timeOnlySchema,
    endTime: timeOnlySchema.nullable(),
    date: dateOnlyJsonSchema,
    outdated: z.boolean(),
    /** DRAFT on a presented notice means its pdf could not be rendered again after the presentation */
    status: presentationPlanStatusSchema,
    createdAt: z.iso.datetime(),
    createdBy: writerSchema,
    updatedAt: z.iso.datetime().nullable(),
    updatedBy: writerSchema,
    presentedAt: z.iso.datetime().nullable(),
    presentedBy: writerSchema,
    formation: z.enum(FormationEnum),
    chairman: z.object({ firstName: z.string(), lastName: z.string() }),
  }),
) {}

function writerOf(user: { id: string; firstName: string; lastName: string } | null) {
  return user ? { id: user.id, name: fullname(user) } : null;
}
