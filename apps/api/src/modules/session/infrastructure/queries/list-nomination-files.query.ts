import { Injectable } from '@nestjs/common';
import z from 'zod';

import {
  dateOnlyJsonSchema,
  Magistrat,
  PrioriteEnum,
  Role,
} from 'shared-models';

import { PrismaService } from 'src/modules/framework/database';
import {
  createPaginatedZodDto,
  paginate,
  Pagination,
} from 'src/modules/framework/pagination';
import {
  prioriteEnumToPrismaPrioriteEnum,
  prismaPrioriteEnumToPrioriteEnum,
} from 'src/modules/shared/mappers/priorite.mapper';
import { DateOnly } from 'src/utils/date-only';
import {
  NominationFileOutcome,
  NominationFileOutcomeEnum,
} from '../../domain/nomination-file-outcome';
import type { NominationFileSortField } from '../dtos/nomination-file.dto';
import { AffectationVersionFinder } from '../finders/affectation-version.finder';

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
    filters: {
      reporterIds: readonly string[];
      priorities: readonly PrioriteEnum[];
    };
    sort: {
      field: NominationFileSortField | undefined;
      direction: 'asc' | 'desc';
    };
  }): Promise<PaginatedNominationFileAffectationItem> {
    const isSG = query.user.role === Role.ADJOINT_SECRETAIRE_GENERAL;

    const { files, totalCount } = await this.prisma.$transaction(async (tx) => {
      const lastVersion = await this.versionFinder.last({
        tx,
        sessionId: query.sessionId,
      });

      const where = {
        sessionId: query.sessionId,
        priorite: {
          in:
            query.filters.priorities.length > 0
              ? query.filters.priorities.map(prioriteEnumToPrismaPrioriteEnum)
              : undefined,
        },
        reporterIds:
          query.filters.reporterIds.length > 0
            ? {
                some: {
                  versionId: lastVersion?.id,
                  userId: { in: query.filters.reporterIds as string[] },
                },
              }
            : undefined,
      };

      const totalCount = await tx.dossierDeNomination.count({ where });
      const orderBy = this.buildOrderBy(query.sort.field, query.sort.direction);

      const files = await tx.dossierDeNomination.findMany({
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
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
          _count: {
            select: { observations: true },
          },
        },
      });

      return { files, totalCount };
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
        observationCount: x._count.observations,
      };
    });

    return paginate({ items, totalCount, pagination: query.pagination });
  }

  private buildOrderBy(
    field: NominationFileSortField | undefined,
    direction: 'asc' | 'desc',
  ): Record<string, 'asc' | 'desc'> {
    if (!field) return { number: 'asc' };

    const fieldMapping: Record<NominationFileSortField, string> = {
      nomMagistrat: 'name',
      numeroDeDossier: 'number',
      dateEcheance: 'dueDate',
      priority: 'priorite',
      grade: 'grade',
      gradeCible: 'targetedGrade',
    };

    const dbField = fieldMapping[field];
    return dbField ? { [dbField]: direction } : { number: 'asc' };
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
});

type NominationFileAffectationItem = z.infer<
  typeof NominationFileAffectationItemSchema
>;

export class PaginatedNominationFileAffectationItem extends createPaginatedZodDto(
  NominationFileAffectationItemSchema,
) {}
