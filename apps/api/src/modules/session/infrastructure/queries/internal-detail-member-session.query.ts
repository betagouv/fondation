import { Injectable, NotFoundException } from '@nestjs/common';
import { load } from 'cheerio';
import z from 'zod';

import {
  dateOnlyJsonSchema,
  NominationFile,
  PrioriteEnum,
  Role,
  TypeDeSaisine,
} from 'shared-models';

import { PrismaReportStateEnum } from 'src/generated/prisma/enums';
import {
  internalCountTotalDetailsMemberSessionRawQuery,
  internalDetailsMemberSessionRawQuery,
} from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';
import {
  createPaginatedZodDto,
  paginate,
  Pagination,
} from 'src/modules/framework/pagination';
import { Sortable } from 'src/modules/framework/sorting';
import { DetailsMemberSessionQueryDto } from 'src/modules/members/infrastructure/dtos/members.dto';
import { roleToFormation } from 'src/modules/members/infrastructure/member.utils';
import { prismaPrioriteEnumToPrioriteEnum } from 'src/modules/shared/mappers/priorite.mapper';
import { DateOnly } from 'src/utils/date-only';
import { assertIsDefined, isDefined } from 'src/utils/is-defined';

@Injectable()
export class InternalDetailMemberSessionQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    user: { id: string; role: Role };
    status: NominationFile.ReportState[] | undefined;
    sessionId: string;
    typeDeSaisine: TypeDeSaisine;
    pagination: Pagination;
    sorting: Sortable<DetailsMemberSessionQueryDto>;
  }): Promise<DetailedMemberSessionDto> {
    const [session, totalCount, files] = await this.prisma.$transaction(
      async (tx) => {
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
            sessionImportId: true,
            formation: true,
            date: true,
            dueDate: true,
          },
          where: {
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
          ),
        );

        return [session, Number(total?.count ?? 0), files];
      },
    );

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
                      .array(
                        z.object({ userId: z.string(), comment: z.string() }),
                      )
                      .nullable()
                      .default([]),
                    magistrat: z.preprocess(
                      (x) => (Array.isArray(x) ? x[0] : x),
                      z
                        .object({
                          id: z.string(),
                          firstName: z.string(),
                          lastName: z.string(),
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
          ? d.priorities.map(prismaPrioriteEnumToPrioriteEnum)
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
                }
              : null,
          })),

          /** @deprecated */
          observers: d.observers,
          /** @deprecated */
          observationMagistrats: (observations ?? [])
            .filter((obs) => obs && obs.magistrat)
            .map((obs) => ({
              id: obs!.magistrat!.id,
              firstName: obs!.magistrat!.firstName,
              lastName: obs!.magistrat!.lastName,
              observationId: obs!.id,
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
        sessionImportId: session.sessionImportId,
        formation: session.formation,
        transparency: session.name,
        dateTransparence: DateOnly.fromDate(session.date).toJson(),
        dateSeance:
          DateOnly.fromOptionalDate(session.dueDate)?.toJson() ?? null,
      },
    };
  }
}

export class DetailedMemberSessionDto extends createPaginatedZodDto(
  z.object({
    id: z.string(),
    nominationFileId: z.string(),
    state: z.string(),
    formation: z.string(),
    folderNumber: z.number().nullable(),
    priorities: z.array(z.enum(PrioriteEnum)),
    /** @deprecated */
    filePriority: z
      .enum(PrioriteEnum)
      .nullable()
      .meta({ deprecated: true, description: 'prefer priorities' }),
    dueDate: dateOnlyJsonSchema.nullable(),
    name: z.string(),
    grade: z.string(),
    currentPosition: z.string().nullable(),
    targettedPosition: z.string(),
    /** @deprecated legacy observations from LODAM. Prefer observations */
    observers: z.array(z.string()).meta({
      deprecated: true,
      description: 'legacy observations from LODAM. Prefer observations',
    }),
    /** @deprecated prefer observations */
    observationMagistrat: z
      .array(
        z.object({
          id: z.string(),
          firstName: z.string(),
          lastName: z.string(),
          observationId: z.string(),
        }),
      )
      .meta({ deprecated: true, description: 'prefer observations' }),
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
          })
          .nullable(),
      }),
    ),
  }),

  z.object({
    session: z.object({
      id: z.string(),
      sessionImportId: z.string(),
      formation: z.string(),
      transparency: z.string(),
      dateTransparence: dateOnlyJsonSchema,
      dateSeance: dateOnlyJsonSchema.nullable(),
    }),
  }),
) {}
