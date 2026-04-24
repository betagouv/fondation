import { Injectable } from '@nestjs/common';
import { load } from 'cheerio';
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
import { ObservationFollowUp } from 'src/modules/observation/domain/observation-follow-up';
import {
  prioriteEnumToPrismaPrioriteEnum,
  prismaPrioriteEnumToPrioriteEnum,
} from 'src/modules/shared/mappers/priorite.mapper';
import { DateOnly } from 'src/utils/date-only';
import { partition } from 'src/utils/iterables';
import {
  NominationFileOutcome,
  NominationFileOutcomeEnum,
} from '../../domain/nomination-file-outcome';
import { ListNominationFilesQueryDto } from '../dtos/nomination-file.dto';
import {
  AffectationVersionFinder,
  OptionalAffectationVersion,
} from '../finders/affectation-version.finder';

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
      outcomes: readonly (NominationFileOutcomeEnum | null)[];
    };
  }): Promise<PaginatedNominationFiles> {
    const isSG = [Role.ADJOINT_SECRETAIRE_GENERAL, Role.ADMIN].includes(
      query.user.role,
    );

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
      const lastVersion = isSG
        ? await this.versionFinder.last({
            tx,
            sessionId: query.sessionId,
          })
        : await this.versionFinder.lastPublished({
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
          priorities: true,
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
          alertHidden: true,
          commentAccess: {
            select: { userId: true },
          },
          detectedJurisdictionId: true,
          detectedTargetedFunctionId: true,
          reporterIds: {
            where: { versionId: lastVersion.optionalId },
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
              description: true,
              memberComments: {
                where: { userId: query.user.id },
                select: { comment: true },
              },
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
          detectedTargetedFunctionId: x.detectedTargetedFunctionId ?? null,
          detectedJurisdictionId: x.detectedJurisdictionId ?? null,
          outcome: x.outcome
            ? {
                comment: x.outcomeComment,
                value: x.outcome as NominationFileOutcomeEnum,
              }
            : null,
          isAlertHidden: x.alertHidden,
        },
        priorities: x.priorities.map(prismaPrioriteEnumToPrioriteEnum),
        // TODO: remove
        priority: x.priorities[0]
          ? prismaPrioriteEnumToPrioriteEnum(x.priorities[0])
          : null,
        comment: x.comment,
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
            hasDescription: !!obs.description.trim(),
            hasUserComment: obs.memberComments.some(
              ({ comment }) =>
                !!load(comment || '')
                  ?.text()
                  ?.trim(),
            ),
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
      outcomes: readonly (NominationFileOutcomeEnum | null)[];
    },
    lastVersion: OptionalAffectationVersion,
  ): Prisma.DossierDeNominationWhereInput {
    const where: Prisma.DossierDeNominationWhereInput[] = [];

    if (filters.priorities.length > 0) {
      const [hasNoPriority, priorities] = partition(
        filters.priorities,
        (x) => x === null,
      );

      // WHERE priorities = ARRAY[] OR priorities && ${priorities}::priorite_enum[]
      where.push({
        OR: [
          { priorities: hasNoPriority.length > 0 ? { equals: [] } : undefined },
          {
            priorities:
              priorities.length > 0
                ? { hasSome: priorities.map(prioriteEnumToPrismaPrioriteEnum) }
                : undefined,
          },
        ],
      });
    }

    if (filters.reporterIds.length > 0) {
      const [hasNoReporter, reporterIds] = partition(
        filters.reporterIds,
        (x) => x === null,
      );

      // WHERE (
      //   NOT EXISTS (select id from nomination_file_to_reporter nfr WHERE nfr.version_id = ${lastVersion.optionalId})
      //   OR (version_id = ${lastVersion.optionalId} AND nfr.user_id IN (${reporterIds}))
      // )
      where.push({
        OR: [
          {
            reporterIds:
              hasNoReporter.length > 0
                ? { none: { versionId: lastVersion.optionalId } }
                : undefined,
          },
          {
            reporterIds:
              reporterIds.length > 0
                ? {
                    some: {
                      userId: { in: reporterIds },
                      versionId: lastVersion.optionalId,
                    },
                  }
                : undefined,
          },
        ],
      });
    }

    if (filters.outcomes.length > 0) {
      const [hasNoOutcome, withOutcome] = partition(
        filters.outcomes,
        (x) => x === null,
      );

      // WHERE outcome IS NULL OR outcome IN (...${outcomes})
      where.push({
        OR: [
          { outcome: hasNoOutcome.length > 0 ? null : undefined },
          { outcome: withOutcome.length > 0 ? { in: withOutcome } : undefined },
        ],
      });
    }

    return { AND: where.length > 0 ? where : undefined };
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
  detectedJurisdictionId: z.string().nullable(),
  detectedTargetedFunctionId: z.string().nullable(),
  outcome: z
    .object({
      value: z.enum(NominationFileOutcome.enum),
      comment: z.string().nullable(),
    })
    .nullable(),
  isAlertHidden: z.boolean(),
});

const NominationFileAffectationItemSchema = z.object({
  id: z.string(),
  priorities: z.array(z.enum(PrioriteEnum)),
  priority: z.enum(PrioriteEnum).nullable().meta({ deprecated: true }),
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
      hasDescription: z.boolean(),
      hasUserComment: z.boolean(),
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

export type NominationFileAffectationItem = z.infer<
  typeof NominationFileAffectationItemSchema
>;

export class PaginatedNominationFiles extends createPaginatedZodDto(
  NominationFileAffectationItemSchema,
) {}
