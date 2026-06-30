import { Injectable } from '@nestjs/common';
import z from 'zod';

import { ListGdsNominationSessionsQueryDto } from '../../abstract-session.dto';
import { Prisma } from 'src/generated/prisma/client';
import { findReportedSessionIds } from 'src/generated/prisma/sql';
import { Db } from 'src/modules/framework/database';
import { createPaginatedZodDto, paginate, Pagination } from 'src/modules/framework/pagination';
import { Sortable } from 'src/modules/framework/sorting';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { prismaTypeDeSaisineEnumToTypeDeSaisine } from 'src/modules/shared/mappers/type-de-saisine-enum.mapper';
import { TypeDeSaisineEnum } from 'src/modules/shared/type-de-saisine.enum';
import { DateOnly, dateOnlyJsonSchema } from 'src/utils/date-only';

export const SESSION_STATUSES = ['TO_VALIDATE', 'READY', 'REPORTED'] as const;
type SessionStatus = (typeof SESSION_STATUSES)[number];

@Injectable()
export class ListSessionsQuery {
  constructor(private readonly db: Db) {}

  async handle(query: {
    search: string | null;
    typeDeSaisine: TypeDeSaisineEnum;
    formations: readonly FormationEnum[] | undefined;
    sorting: Sortable<ListGdsNominationSessionsQueryDto>;
    pagination: Pagination;
  }): Promise<ListedNominationSessionsDto> {
    const where: Prisma.SessionWhereInput = {
      deletedAt: null,
      archivedAt: null,
      typeDeSaisine: query.typeDeSaisine,
      ...(query.formations?.length && {
        formation: { in: [...query.formations] },
      }),
      ...(query.search && {
        name: { contains: query.search, mode: 'insensitive' },
      }),
    };

    const orderBy: Prisma.SessionOrderByWithRelationInput[] = query.sorting.sortBy
      ? [{ [query.sorting.sortBy]: query.sorting.sortDesc ? ('desc' as const) : ('asc' as const) }]
      : [{ date: 'desc' as const }, { createdAt: 'asc' as const }];

    const [totalCount, sessions, reportedIds] = await this.db.withTransaction(async () => {
      const txCount = await this.db.tx.session.count({ where });
      const txSessions = await this.db.tx.session.findMany({
        where,
        orderBy,
        skip: (query.pagination.page - 1) * query.pagination.limit,
        take: query.pagination.limit,
        select: {
          id: true,
          name: true,
          formation: true,
          date: true,
          typeDeSaisine: true,
          validatedAt: true,

          transparenceGds: { select: { dueDate: true } },
        },
      });

      const reportedRows = await this.db.tx.$queryRawTyped(
        findReportedSessionIds(txSessions.map((s) => s.id)),
      );
      const txReportedIds = new Set(reportedRows.map(({ id }) => id));

      return [txCount, txSessions, txReportedIds];
    });

    const items = sessions.map((s) => ({
      id: s.id,
      name: s.name,
      formation: prismaFormationEnumToFormationEnum(s.formation),
      date: DateOnly.fromDate(s.date).toJson(),
      dueDate: DateOnly.fromOptionalDate(s.transparenceGds?.dueDate)?.toJson() ?? null,
      typeDeSaisine: prismaTypeDeSaisineEnumToTypeDeSaisine(s.typeDeSaisine),
      status: ListSessionsQuery.computeStatus(s, reportedIds),
    }));

    return paginate({ items, totalCount, pagination: query.pagination });
  }

  private static computeStatus(
    session: { id: string; validatedAt: Date | null },
    reportedIds: ReadonlySet<string>,
  ): SessionStatus {
    if (!session.validatedAt) return 'TO_VALIDATE';
    if (reportedIds.has(session.id)) return 'REPORTED';
    return 'READY';
  }
}

export class ListedNominationSessionsDto extends createPaginatedZodDto(
  z.object({
    id: z.string(),
    name: z.string(),
    formation: z.enum(FormationEnum),
    date: dateOnlyJsonSchema,
    dueDate: dateOnlyJsonSchema.nullable(),
    typeDeSaisine: z.enum(TypeDeSaisineEnum),
    status: z.enum(SESSION_STATUSES),
  }),
) {}
