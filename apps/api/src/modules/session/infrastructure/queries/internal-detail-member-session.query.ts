import { Injectable, NotFoundException } from '@nestjs/common';
import z from 'zod';

import {
  dateOnlyJsonSchema,
  NominationFile,
  PrioriteEnum,
  Role,
  TypeDeSaisine,
} from 'shared-models';

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
import { reportStateToPrismaReportStateEnum } from 'src/modules/shared/mappers/rapport-statut.mapper';
import { DateOnly } from 'src/utils/date-only';
import { assertIsDefined } from 'src/utils/is-defined';
import { AffectationVersionFinder } from '../finders/affectation-version.finder';

@Injectable()
export class InternalDetailMemberSessionQuery {
  constructor(
    private readonly prisma: PrismaService,
    private versionFinder: AffectationVersionFinder,
  ) {}

  async handle(query: {
    user: { id: string; role: Role };
    status: NominationFile.ReportState[] | undefined;
    sessionId: string;
    typeDeSaisine: TypeDeSaisine;
    pagination: Pagination;
    sorting: Sortable<DetailsMemberSessionQueryDto>;
  }): Promise<DetailedMemberSessionDto> {
    const [totalCount, session] = await this.prisma.$transaction(async (tx) => {
      const version = await this.versionFinder
        .lastPublished({
          sessionId: query.sessionId,
          tx,
        })
        .then((v) => v.getNullable());

      if (!version) throw new NotFoundException();

      const sortOrder = query.sorting.sortDesc ? 'desc' : 'asc';

      const formation = roleToFormation(query.user.role);

      const totalCount = await tx.dossierDeNomination.count({
        where: {
          sessionId: query.sessionId,
          reporterIds: {
            some: { versionId: version.id, userId: query.user.id },
          },
        },
      });

      const session = await tx.session.findFirst({
        where: {
          formation,
          id: query.sessionId,
          typeDeSaisine: query.typeDeSaisine,
        },
        select: {
          id: true,
          name: true,
          typeDeSaisine: true,
          formation: true,
          sessionImportId: true,
          date: true,
          dueDate: true,
          dossierDeNominations: {
            take: query.pagination.limit,
            skip: (query.pagination.page - 1) * query.pagination.limit,
            orderBy: [
              {
                name: query.sorting.sortBy === 'name' ? sortOrder : undefined,
                number:
                  query.sorting.sortBy === 'number' ? sortOrder : undefined,
                targetedPosition:
                  query.sorting.sortBy == 'targetedPosition'
                    ? sortOrder
                    : undefined,
              },
            ],
            where: {
              reports: {
                some: {
                  isDeleted: false,
                  reporterId: query.user.id,
                  state: {
                    in: query.status?.map(reportStateToPrismaReportStateEnum),
                  },
                },
              },
              reporterIds: {
                some: { versionId: version.id, userId: query.user.id },
              },
            },
            select: {
              id: true,
              biography: true,
              birthDate: true,
              currentPosition: true,
              grade: true,
              lastPositionDate: true,
              lastRankingDate: true,
              name: true,
              number: true,
              observers: true,
              rank: true,
              targetedPosition: true,
              priorite: true,
              reports: {
                take: 1,
                select: { id: true, state: true },
                where: {
                  isDeleted: false,
                  reporterId: query.user.id,
                  state: {
                    in: query.status?.map(reportStateToPrismaReportStateEnum),
                  },
                },
              },
              observations: {
                select: {
                  id: true,
                  magistrat: {
                    select: { id: true, firstName: true, lastName: true },
                  },
                },
              },
            },
          },
        },
      });

      return [totalCount, session];
    });

    if (!session) throw new NotFoundException();

    const paginated = paginate({
      items: session.dossierDeNominations.map((d) => {
        const { id, state } = assertIsDefined(d.reports[0]);

        return {
          id,
          nominationFileId: d.id,
          state,
          formation: session.formation,
          folderNumber: d.number,
          currentPosition: d.currentPosition,
          dueDate: null,
          name: d.name ?? '',
          grade: d.grade ?? '',
          targettedPosition: d.targetedPosition ?? '',
          filePriority: d.priorite
            ? prismaPrioriteEnumToPrioriteEnum(d.priorite)
            : null,
          observers: d.observers,
          observationMagistrats: d.observations
            .filter((obs) => obs.magistrat)
            .map((obs) => ({
              id: obs.magistrat!.id,
              firstName: obs.magistrat!.firstName,
              lastName: obs.magistrat!.lastName,
              observationId: obs.id,
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
    filePriority: z.enum(PrioriteEnum).nullable(),
    dueDate: dateOnlyJsonSchema.nullable(),
    name: z.string(),
    grade: z.string(),
    currentPosition: z.string().nullable(),
    targettedPosition: z.string(),
    observers: z.array(z.string()),
    observationMagistrats: z.array(
      z.object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        observationId: z.string(),
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
