import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { load } from 'cheerio';
import z from 'zod';

import { dateOnlyJsonSchema, Magistrat, PrioriteEnum, Role } from 'shared-models';

import { NOMINATION_SESSION_FILE_STATUSES, UpdatableNominationFile } from '../../domain/nomination-file';
import { NominationFileOutcome, NominationFileOutcomeEnum } from '../../domain/nomination-file-outcome';
import { ListNominationFilesQueryDto } from '../dtos/nomination-file.dto';
import { AffectationVersionFinder, OptionalAffectationVersion } from '../finders/affectation-version.finder';
import { PrismaPrioriteEnum } from 'src/generated/prisma/enums';
import { listNominationFilesCountRawQuery, listNominationFilesRawQuery } from 'src/generated/prisma/sql';
import { DocsService } from 'src/modules/docs/docs.service';
import { PrismaService } from 'src/modules/framework/database';
import { createPaginatedZodDto, paginate, Pagination } from 'src/modules/framework/pagination';
import { Sortable } from 'src/modules/framework/sorting';
import { ObservationFollowUp } from 'src/modules/observation/domain/observation-follow-up';
import {
  prioriteEnumToPrismaPrioriteEnum,
  prismaPrioriteEnumToPrioriteEnum,
} from 'src/modules/shared/mappers/priorite.mapper';
import { DateOnly } from 'src/utils/date-only';
import { toFullTextQuery } from 'src/utils/fulltext-search';
import { partition } from 'src/utils/iterables';

@Injectable()
export class ListNominationFilesQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versionFinder: AffectationVersionFinder,

    @Inject(forwardRef(() => DocsService))
    private readonly docs: DocsService,
  ) {}

  async handle(query: {
    sessionId: string;
    user: { id: string; role: Role };
    pagination: Pagination;
    sorting: Sortable<ListNominationFilesQueryDto>;
    filters: {
      search: string | null;
      reporterIds: readonly (string | null)[];
      priorities: readonly (PrioriteEnum | null)[];
      outcomes: readonly (NominationFileOutcomeEnum | null)[];
    };
  }): Promise<PaginatedNominationFiles> {
    const [totalCount, files, sessionArchivedAt] = await this.prisma.$transaction(async (tx) => {
      const isSG = [Role.ADJOINT_SECRETAIRE_GENERAL, Role.ADMIN].includes(query.user.role);
      const lastVersion = isSG
        ? await this.versionFinder.last({
            tx,
            sessionId: query.sessionId,
          })
        : await this.versionFinder.lastPublished({
            tx,
            sessionId: query.sessionId,
          });

      const where = ListNominationFilesQuery.filtersToPrismaWhere(query.filters, lastVersion);

      const [{ count: txCount } = { count: 0n }] = await tx.$queryRawTyped(
        listNominationFilesCountRawQuery(
          where.versionId ?? null,
          where.priorities,
          where.hasNoPriorities,
          where.reporterIds,
          where.hasNoReporters,
          where.outcomes,
          where.hasNoOutcome,
          where.search,
          query.sessionId,
        ),
      );

      const txFiles = await tx
        .$queryRawTyped(
          listNominationFilesRawQuery(
            where.versionId ?? null,
            query.user.id,
            query.pagination.limit,
            (query.pagination.page - 1) * query.pagination.limit,
            where.priorities,
            where.hasNoPriorities,
            where.reporterIds,
            where.hasNoReporters,
            where.outcomes,
            where.hasNoOutcome,
            where.search,
            query.sorting.sortBy ?? null,
            query.sorting.sortDesc ? 'desc' : 'asc',
            query.sessionId,
          ),
        )
        .then((list) => RawListedNominationFiles.parseAsync(list));

      const nominationFileIds = new Set(txFiles.map(({ id }) => id));
      const { items: linkedDocs } = await this.docs.internalFindNominationFilesLinkedDocs({
        tx,
        nominationFileIds,
      });

      const session = await tx.session.findUnique({
        where: { id: query.sessionId },
        select: { archivedAt: true },
      });

      return [
        Number(txCount ?? 0n),
        txFiles.map((file) => {
          const docs = linkedDocs.get(file.id) ?? [];
          const updatable = UpdatableNominationFile.from({
            id: file.id,
            outcome: file.outcome,
            docs,
          });

          return {
            ...file,
            status: updatable.status(),
            isUpdatable: updatable.isUpdatable(),
          };
        }),
        session?.archivedAt,
      ];
    });

    const isArchived = !!sessionArchivedAt;
    const items = files.map((x): NominationFileAffectationItem => {
      return {
        id: x.id,
        isArchived,
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
          dateDeNaissance: DateOnly.fromOptionalDate(x.birthDate)?.toJson() ?? null,
          dateEchéance: DateOnly.fromOptionalDate(x.dueDate)?.toJson() ?? null,
          datePassageAuGrade: DateOnly.fromOptionalDate(x.lastRankingDate)?.toJson() ?? null,
          datePriseDeFonctionPosteActuel: DateOnly.fromOptionalDate(x.lastPositionDate)?.toJson() ?? null,
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
          isUpdatable: x.isUpdatable,
          status: x.status,
        },
        priorities: x.priorities.map(prismaPrioriteEnumToPrioriteEnum),
        comment: x.comment,
        auditionDate: x.auditionDate?.toISOString() ?? null,
        reporters: x.reporters.map(({ user: { id, firstName, lastName } }) => ({
          id,
          firstName,
          lastName,
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
        memo: x.memberMemo || null,
        summary: x.summary
          ? {
              id: x.id,
              canWrite: x.summary.authorId === query.user.id,
              canRead:
                x.summary.authorId === query.user.id ||
                x.summary.readers.some((userId) => userId === query.user.id),
            }
          : null,
        hasAttachment: x.hasAttachment,
      };
    });

    return paginate({ items, totalCount, pagination: query.pagination });
  }

  private static filtersToPrismaWhere(
    filters: {
      search: string | null;
      reporterIds: readonly (string | null)[];
      priorities: readonly (PrioriteEnum | null)[];
      outcomes: readonly (NominationFileOutcomeEnum | null)[];
    },
    lastVersion: OptionalAffectationVersion,
  ) {
    const [hasNoReporters, reporterIds] = partition(filters.reporterIds, (x) => x === null);
    const [hasNoPriorities, priorities] = partition(filters.priorities, (x) => x === null);
    const [hasNoOutcome, outcomes] = partition(filters.outcomes, (x) => x === null);

    return {
      versionId: lastVersion.optionalId,
      reporterIds: reporterIds.length > 0 ? reporterIds : null,
      hasNoReporters: hasNoReporters.length > 0,
      priorities: priorities.length > 0 ? priorities.map(prioriteEnumToPrismaPrioriteEnum) : null,
      hasNoPriorities: hasNoPriorities.length > 0,
      outcomes: outcomes.length > 0 ? outcomes : null,
      hasNoOutcome: hasNoOutcome.length > 0,
      search: filters.search?.trim() ? toFullTextQuery(filters.search) : null,
    };
  }
}

const NominationFileContentSchema = z.object({
  // open api generator does not support z.literal (json schema const)
  version: z.number().min(2).max(2).meta({ example: 2, description: 'always 2' }),
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

  isUpdatable: z.boolean(),
  status: z.enum(NOMINATION_SESSION_FILE_STATUSES),
});

const RawListedNominationFiles = z.array(
  z.object({
    id: z.uuid(),
    priorities: z.array(z.enum(PrismaPrioriteEnum)).transform((x) => x.map(prismaPrioriteEnumToPrioriteEnum)),
    comment: z.string().nullable(),
    auditionDate: z.date().nullable(),
    biography: z.string().nullable(),
    birthDate: z.date().nullable(),
    currentPosition: z.string().nullable(),
    grade: z.enum(Magistrat.Grade),
    lastPositionDate: z.date().nullable(),
    lastRankingDate: z.date().nullable(),
    name: z.string(),
    number: z.number().int().gt(0),
    observers: z.array(z.string()),
    rank: z.string().nullable(),
    targetedPosition: z.string().nullable(),
    targetedGrade: z.enum(Magistrat.Grade).nullable(),
    dueDate: z.date().nullable(),
    outcome: z.enum(NominationFileOutcome.enum).nullable(),
    outcomeComment: z.string().nullable(),
    alertHidden: z.boolean(),
    detectedJurisdictionId: z.string().nullable(),
    detectedTargetedFunctionId: z.string().nullable(),
    hasAttachment: z.boolean(),
    queryRank: z.number().nullable(),

    memberMemo: z.string().nullable(),

    reporters: z
      .array(
        z.object({
          user: z.object({
            id: z.uuid(),
            firstName: z.string(),
            lastName: z.string(),
          }),
        }),
      )
      .nullish()
      .transform((x) => x ?? []),

    observations: z
      .array(
        z.object({
          id: z.string(),
          followUp: z.enum(ObservationFollowUp.enum).nullable(),
          followUpComment: z.string().nullable(),
          description: z
            .string()
            .trim()
            .nullish()
            .transform((x) => x || ''),
          dateReception: z.coerce.date(),
          magistrat: z.object({ id: z.string(), firstName: z.string(), lastName: z.string() }),
          memberComments: z.array(z.object({ comment: z.string().nullable() })),
        }),
      )
      .nullish()
      .transform((x) => x ?? []),

    summary: z
      .object({
        authorId: z.string(),
        readers: z
          .array(z.string())
          .nullish()
          .transform((x) => x ?? []),
      })
      .nullable(),
  }),
);

const NominationFileAffectationItemSchema = z.object({
  id: z.string(),
  isArchived: z.boolean(),
  priorities: z.array(z.enum(PrioriteEnum)),
  content: NominationFileContentSchema,
  comment: z.string().nullable(),
  auditionDate: z.iso.datetime().nullable(),
  reporters: z.array(
    z.object({
      id: z.string(),
      firstName: z.string(),
      lastName: z.string(),
    }),
  ),
  observations: z.array(
    z.object({
      id: z.string(),
      date: dateOnlyJsonSchema,
      followUp: z.enum(ObservationFollowUp.enum).nullable(),
      followUpComment: z.string().nullable(),
      hasDescription: z.boolean(),
      hasUserComment: z.boolean(),
      magistrat: z.object({ id: z.string(), firstName: z.string(), lastName: z.string() }).nullable(),
    }),
  ),
  memo: z.string().nullable(),
  summary: z.object({ id: z.string(), canRead: z.boolean(), canWrite: z.boolean() }).nullable(),
  hasAttachment: z.boolean(),
});

export type NominationFileAffectationItem = z.infer<typeof NominationFileAffectationItemSchema>;

export class PaginatedNominationFiles extends createPaginatedZodDto(NominationFileAffectationItemSchema) {}
