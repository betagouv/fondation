import { Injectable, NotFoundException } from '@nestjs/common';
import { load } from 'cheerio';
import z from 'zod';

import { PrismaPrioriteEnum, PrismaReportStateEnum } from 'src/generated/prisma/enums';
import {
  internalCountTotalDetailsMemberSessionRawQuery,
  internalDetailsMemberSessionRawQuery,
} from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';
import { createPaginatedZodDto, paginate, Pagination } from 'src/modules/framework/pagination';
import { Sortable } from 'src/modules/framework/sorting';
import { DetailsMemberSessionQueryDto } from 'src/modules/members/infrastructure/dtos/members.dto';
import { roleToFormation } from 'src/modules/members/infrastructure/member.utils';
import { NominationFileOutcome } from 'src/modules/session/shared/types/nomination-file-outcome';
import { GradeEnum } from 'src/modules/shared/grade.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { prismaPrioriteEnumToPriorityEnum } from 'src/modules/shared/mappers/priorite.mapper';
import { PriorityEnum } from 'src/modules/shared/priority.enum';
import { ReportStateEnum } from 'src/modules/shared/report-state.enum';
import type { RoleEnum } from 'src/modules/shared/role.enum';
import { TypeDeSaisineEnum } from 'src/modules/shared/type-de-saisine.enum';
import { DateOnly, dateOnlyJsonSchema } from 'src/utils/date-only';
import { assertIsDefined, isDefined } from 'src/utils/is-defined';

@Injectable()
export class InternalDetailMemberSessionQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    user: { id: string; role: RoleEnum };
    status: ReportStateEnum[] | undefined;
    priorities: (PriorityEnum | null)[] | undefined;
    sessionId: string;
    typeDeSaisine: TypeDeSaisineEnum;
    pagination: Pagination;
    sorting: Sortable<DetailsMemberSessionQueryDto>;
  }): Promise<DetailedMemberSessionDto> {
    const [session, totalCount, files] = await this.prisma.$transaction(async (tx) => {
      const formation = roleToFormation(query.user.role);

      const [total] = await tx.$queryRawTyped(
        internalCountTotalDetailsMemberSessionRawQuery(
          formation ?? null,
          query.sessionId,
          'TRANSPARENCE_GDS',
          query.user.id,
          query.status ?? null,
        ),
      );

      const session = await tx.session.findFirst({
        select: {
          id: true,
          name: true,
          formation: true,
          date: true,
          archivedAt: true,
          transparenceGds: { select: { dueDate: true } },
        },
        where: {
          deletedAt: null,
          typeDeSaisine: 'TRANSPARENCE_GDS',
          id: query.sessionId,
          formation,
        },
      });

      const files = await tx.$queryRawTyped(
        internalDetailsMemberSessionRawQuery(
          formation ?? null,
          query.sessionId,
          'TRANSPARENCE_GDS',
          query.user.id,
          query.status ?? null,
          query.sorting.sortDesc ? 'desc' : 'asc',
          query.sorting.sortBy ?? null,
          query.pagination.limit,
          (query.pagination.page - 1) * query.pagination.limit,
          (query.priorities ?? []).length > 0 ? (query.priorities as string[]) : null,
        ),
      );

      return [session, Number(total?.count ?? 0), files];
    });

    if (!session) throw new NotFoundException();

    const paginated = paginate({
      items: files.map((d) => {
        const { reports, observations } = z
          .object({
            reports: z.array(
              z.object({
                id: z.string(),
                state: z.enum(PrismaReportStateEnum),
              }),
            ),
            observations: z
              .array(
                z
                  .object({
                    id: z.string(),
                    description: z.string().trim(),
                    userComments: z
                      .array(z.object({ userId: z.string(), comment: z.string() }))
                      .nullable()
                      .default([]),
                    magistrat: z.preprocess(
                      (x) => (Array.isArray(x) ? x[0] : x),
                      z
                        .object({
                          id: z.string(),
                          firstName: z.string(),
                          lastName: z.string(),
                          usedName: z.string().nullable(),
                        })
                        .nullish(),
                    ),
                  })
                  .nullable(),
              )
              .nullable(),
          })
          .parse(d);
        const { id, state } = assertIsDefined(reports[0]);

        const priorities = Array.isArray(d.priorities)
          ? d.priorities.map((x) => prismaPrioriteEnumToPriorityEnum(x as PrismaPrioriteEnum))
          : [];
        // TODO: remove once filePriority removed
        const filePriority = priorities[0] ?? null;

        return {
          id,
          state,
          priorities,
          /** @deprecated */
          filePriority,

          nominationFileId: d.id,
          formation: session.formation,
          folderNumber: d.number,
          currentPosition: d.currentPosition,
          dueDate: null,
          name: d.name ?? '',
          grade: d.grade ?? '',
          targettedPosition: d.targetedPosition ?? '',
          targetedGrade: d.targetedGrade,

          observers: d.observers,
          observations: (observations || []).filter(isDefined).map((o) => ({
            id: o.id,
            hasDescription: o.description.length > 0,
            hasUserComment: !!o.userComments?.some(
              ({ comment }) =>
                !!load(comment ?? '')
                  .text()
                  .trim(),
            ),
            magistrat: o.magistrat
              ? {
                  id: o.magistrat.id,
                  firstName: o.magistrat.firstName,
                  lastName: o.magistrat.lastName,
                  usedName: o.magistrat.usedName,
                }
              : null,
          })),
        };
      }),
      pagination: query.pagination,
      totalCount,
    });

    return {
      ...paginated,
      session: {
        id: session.id,
        isArchived: !!session.archivedAt,
        formation: session.formation,
        outcomes: NominationFileOutcome.selectableOutcomes(
          prismaFormationEnumToFormationEnum(session.formation),
        ),
        transparency: session.name,
        dateTransparence: DateOnly.fromDate(session.date).toJson(),
        dateSeance: DateOnly.fromOptionalDate(session.transparenceGds?.dueDate)?.toJson() ?? null,
      },
    };
  }
}

export class DetailedMemberSessionDto extends createPaginatedZodDto(
  z.object({
    id: z.string(),
    isArchived: z.boolean(),
    nominationFileId: z.string(),
    state: z.string(),
    formation: z.string(),
    folderNumber: z.number().nullable(),
    priorities: z.array(z.enum(PriorityEnum)),
    /** @deprecated */
    filePriority: z
      .enum(PriorityEnum)
      .nullable()
      .meta({ deprecated: true, description: 'prefer priorities' }),
    dueDate: dateOnlyJsonSchema.nullable(),
    name: z.string(),
    grade: z.string(),
    currentPosition: z.string().nullable(),
    targettedPosition: z.string(),
    targetedGrade: z.enum(GradeEnum),

    observers: z
      .array(z.string())
      .describe(`LODAM observers, we need to keep them until we recover data from LODAM`),
    observations: z.array(
      z.object({
        id: z.string(),
        hasDescription: z.boolean(),
        hasUserComment: z.boolean(),
        magistrat: z
          .object({
            id: z.string(),
            firstName: z.string(),
            lastName: z.string(),
            usedName: z.string().nullable(),
          })
          .nullable(),
      }),
    ),
  }),

  z.object({
    session: z.object({
      id: z.string(),
      isArchived: z.boolean(),
      formation: z.string(),
      outcomes: z.array(
        z.object({
          commentRequired: z.boolean(),
          label: z.string(),
          value: z.enum(NominationFileOutcome.enum),
        }),
      ),
      transparency: z.string(),
      dateTransparence: dateOnlyJsonSchema,
      dateSeance: dateOnlyJsonSchema.nullable(),
    }),
  }),
) {}
