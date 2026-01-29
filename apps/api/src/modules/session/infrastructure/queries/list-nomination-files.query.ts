import { Injectable } from '@nestjs/common';
import z from 'zod';

import {
  dateOnlyJsonSchema,
  Magistrat,
  PrioriteEnum,
  Role,
} from 'shared-models';

import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';
import {
  createPaginatedZodDto,
  paginate,
  Pagination,
} from 'src/modules/framework/pagination';
import { Sortable } from 'src/modules/framework/sorting';
import {
  prioriteEnumToPrismaPrioriteEnum,
  prismaPrioriteEnumToPrioriteEnum,
} from 'src/modules/shared/mappers/priorite.mapper';
import { DateOnly } from 'src/utils/date-only';
import {
  NominationFileOutcome,
  NominationFileOutcomeEnum,
} from '../../domain/nomination-file-outcome';
import { ListNominationFilesQueryDto } from '../dtos/nomination-file.dto';
import { AffectationVersionFinder } from '../finders/affectation-version.finder';
import { isDefined } from 'src/utils/is-defined';
import { ObservationFollowUp } from 'src/modules/observation/domain/observation-follow-up';

@Injectable()
export class ListNominationFilesQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versionFinder: AffectationVersionFinder,
  ) {}

  async handle(query: {
    sessionId: string;
    user: { id: string; role: Role };
    pagination: Pagination;
    sorting: Sortable<ListNominationFilesQueryDto>;
    filters: {
      reporterIds: readonly (string | null)[];
      priorities: readonly (PrioriteEnum | null)[];
    };
  }): Promise<PaginatedNominationFiles> {
    const isSG = query.user.role === Role.ADJOINT_SECRETAIRE_GENERAL;

    const direction = query.sorting.sortDesc ? 'desc' : 'asc';
    const orderBy = (() => {
      switch (query.sorting.sortBy) {
        case 'name':
          return { name: direction } as const;
        case 'targetedPosition':
          return { targetedPosition: direction } as const;
        case 'targetedGrade':
          return [
            { sortableTargetedGrade: direction },
            { number: 'asc' },
          ] as const satisfies Prisma.DossierDeNominationOrderByWithRelationInput[];

        default:
        case 'fileNumber':
          return { number: direction } as const;
      }
    })();

    const [totalCount, files] = await this.prisma.$transaction(async (tx) => {
      const lastVersion = await this.versionFinder.last({
        tx,
        sessionId: query.sessionId,
      });

      const where: Prisma.DossierDeNominationWhereInput = {
        sessionId: query.sessionId,
        ...ListNominationFilesQuery.filtersToPrismaWhere(
          query.filters,
          lastVersion,
        ),
      };

      const txCount = await tx.dossierDeNomination.count({ where });
      const txFiles = await tx.dossierDeNomination.findMany({
        where,
        orderBy,
        take: query.pagination.limit,
        skip: (query.pagination.page - 1) * query.pagination.limit,

        select: {
          id: true,
          priorite: true,
          comment: true,
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
          targetedGrade: true,
          dueDate: true,
          outcome: true,
          outcomeComment: true,
          commentAccess: {
            select: { userId: true },
          },
          reporterIds: {
            where: { versionId: lastVersion?.id },
            select: {
              version: true,
              createdAt: true,
              user: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
          observations: {
            select: {
              id: true,
              followUp: true,
              followUpComment: true,
              dateReception: true,
              magistrat: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
          memberMemos: {
            where: { userId: query.user.id },
            select: { memo: true },
          },
          summary: {
            select: {
              nominationFileId: true,
              authorId: true,
              readers: { select: { userId: true } },
            },
          },
        },
      });

      return [txCount, txFiles];
    });

    const items = files.map((x): NominationFileAffectationItem => {
      const commentAccessUserIds = x.commentAccess.map(({ userId }) => userId);
      const canReadComment =
        isSG || commentAccessUserIds.includes(query.user.id);

      return {
        id: x.id,
        content: {
          version: 2,
          numeroDeDossier: x.number,
          nomMagistrat: x.name,
          grade: x.grade as Magistrat.Grade,
          posteActuel: x.currentPosition,
          posteCible: x.targetedPosition,
          gradeCible: x.targetedGrade as Magistrat.Grade,
          rang: x.rank,
          historique: x.biography,
          observants: x.observers,
          dateDeNaissance:
            DateOnly.fromOptionalDate(x.birthDate)?.toJson() ?? null,
          dateEchéance: DateOnly.fromOptionalDate(x.dueDate)?.toJson() ?? null,
          datePassageAuGrade:
            DateOnly.fromOptionalDate(x.lastRankingDate)?.toJson() ?? null,
          datePriseDeFonctionPosteActuel:
            DateOnly.fromOptionalDate(x.lastPositionDate)?.toJson() ?? null,
          informationCarrière: null,
          outcome: x.outcome
            ? {
                comment: x.outcomeComment,
                value: x.outcome as NominationFileOutcomeEnum,
              }
            : null,
        },
        priority: x.priorite
          ? prismaPrioriteEnumToPrioriteEnum(x.priorite)
          : null,
        comment: canReadComment ? x.comment : null,
        commentAccessUserIds: isSG ? commentAccessUserIds : undefined,
        reporters: x.reporterIds.map(
          ({ user: { id, firstName, lastName } }) => ({
            id,
            firstName,
            lastName,
          }),
        ),
        observationCount: x.observations.length,
        /** @deprecated */
        observationMagistrats: x.observations
          .filter((obs) => obs.magistrat)
          .map((obs) => ({
            id: obs.magistrat!.id,
            firstName: obs.magistrat!.firstName,
            lastName: obs.magistrat!.lastName,
            observationId: obs.id,
          })),
        observations: x.observations.map((obs) => {
          return {
            id: obs.id,
            followUp: obs.followUp,
            followUpComment: obs.followUp ? obs.followUpComment : null,
            date: DateOnly.fromDate(obs.dateReception).toJson(),
            magistrat: obs.magistrat
              ? {
                  id: obs.magistrat.id,
                  firstName: obs.magistrat.firstName,
                  lastName: obs.magistrat.lastName,
                }
              : null,
          };
        }),
        memo: x.memberMemos.at(0)?.memo || null,
        summary: x.summary
          ? {
              id: x.summary.nominationFileId,
              canWrite: x.summary.authorId === query.user.id,
              canRead:
                x.summary.authorId === query.user.id ||
                x.summary.readers.some(
                  ({ userId }) => userId === query.user.id,
                ),
            }
          : null,
      };
    });

    return paginate({ items, totalCount, pagination: query.pagination });
  }

  private static filtersToPrismaWhere(
    filters: {
      reporterIds: readonly (string | null)[];
      priorities: readonly (PrioriteEnum | null)[];
    },
    lastVersion: { id: string } | null,
  ): Prisma.DossierDeNominationWhereInput {
    const wherePriorities: Prisma.DossierDeNominationWhereInput[] = [];
    if (filters.priorities.includes(null)) {
      wherePriorities.push({ priorite: null });
    }

    if (filters.priorities.filter(isDefined).length > 0) {
      wherePriorities.push({
        priorite: {
          in: filters.priorities
            .filter(isDefined)
            .map(prioriteEnumToPrismaPrioriteEnum),
        },
      });
    }

    const whereReporters: Prisma.DossierDeNominationWhereInput[] = [];
    if (filters.reporterIds.includes(null)) {
      whereReporters.push({
        reporterIds: { none: { versionId: lastVersion?.id } },
      });
    }

    if (filters.reporterIds.filter(isDefined).length > 0) {
      whereReporters.push({
        reporterIds: {
          some: {
            versionId: lastVersion?.id,
            userId: { in: filters.reporterIds.filter(isDefined) },
          },
        },
      });
    }

    return {
      AND: [{ OR: wherePriorities }, { OR: whereReporters }],
    };
  }
}

const NominationFileContentSchema = z.object({
  // open api generator does not support z.literal (json schema const)
  version: z
    .number()
    .min(2)
    .max(2)
    .meta({ example: 2, description: 'always 2' }),
  nomMagistrat: z.string(),
  numeroDeDossier: z.number().nullable(),
  dateEchéance: dateOnlyJsonSchema.nullable(),
  grade: z.enum(Magistrat.Grade).nullable(),
  posteActuel: z.string().nullable(),
  posteCible: z.string().nullable(),
  gradeCible: z.enum(Magistrat.Grade),
  rang: z.string().nullable(),
  dateDeNaissance: dateOnlyJsonSchema.nullable(),
  historique: z.string().nullable(),
  observants: z.array(z.string()).nullable(),
  datePassageAuGrade: dateOnlyJsonSchema.nullable(),
  datePriseDeFonctionPosteActuel: dateOnlyJsonSchema.nullable(),
  informationCarrière: z.string().nullable(),
  outcome: z
    .object({
      value: z.enum(NominationFileOutcome.enum),
      comment: z.string().nullable(),
    })
    .nullable(),
});

const NominationFileAffectationItemSchema = z.object({
  id: z.string(),
  priority: z.enum(PrioriteEnum).nullable(),
  content: NominationFileContentSchema,
  comment: z.string().nullable(),
  commentAccessUserIds: z.array(z.string()).optional(),
  reporters: z.array(
    z.object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
    }),
  ),
  observationCount: z.number(),
  observations: z.array(
    z.object({
      id: z.string(),
      date: dateOnlyJsonSchema,
      followUp: z.enum(ObservationFollowUp.enum).nullable(),
      followUpComment: z.string().nullable(),
      magistrat: z
        .object({ id: z.string(), firstName: z.string(), lastName: z.string() })
        .nullable(),
    }),
  ),
  /** @deprecated */
  observationMagistrats: z
    .array(
      z.object({
        id: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        observationId: z.string(),
      }),
    )
    .meta({ deprecated: true }),
  memo: z.string().nullable(),
  summary: z
    .object({ id: z.string(), canRead: z.boolean(), canWrite: z.boolean() })
    .nullable(),
});

type NominationFileAffectationItem = z.infer<
  typeof NominationFileAffectationItemSchema
>;

export class PaginatedNominationFiles extends createPaginatedZodDto(
  NominationFileAffectationItemSchema,
) {}
