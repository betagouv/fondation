import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { load } from 'cheerio';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import * as nominationFilesPolicies from '../../../shared/policies/nomination-file.policies';
import {
  NOMINATION_SESSION_FILE_STATUSES,
  transparenceFileStatus,
} from '../../domain/session-transparence-file-status';
import { ListNominationFilesQueryDto } from '../dtos/nomination-file.dto';
import { AffectationVersionFinder, OptionalAffectationVersion } from '../finders/affectation-version.finder';
import { NominationFileJurisdictionsFinder } from '../finders/nomination-file-jurisdictions.finder';
import { PrismaPrioriteEnum } from 'src/generated/prisma/enums';
import { listNominationFilesCountRawQuery, listNominationFilesRawQuery } from 'src/generated/prisma/sql';
import { DocsService } from 'src/modules/docs/docs.service';
import { Db } from 'src/modules/framework/database';
import { createPaginatedZodDto, paginate, Pagination } from 'src/modules/framework/pagination';
import { Sortable } from 'src/modules/framework/sorting';
import { roleToFormation } from 'src/modules/members/infrastructure/member.utils';
import { ObservationFollowUp } from 'src/modules/observation/domain/observation-follow-up';
import {
  NominationFileOutcome,
  NominationFileOutcomeEnum,
} from 'src/modules/session/shared/types/nomination-file-outcome';
import { GradeEnum } from 'src/modules/shared/grade.enum';
import {
  priorityEnumToPrismaPrioriteEnum,
  prismaPrioriteEnumToPriorityEnum,
} from 'src/modules/shared/mappers/priorite.mapper';
import {
  expectedReportersCount,
  isAuditionExpected,
} from 'src/modules/shared/policies/auditioned-position.policy';
import { PriorityEnum } from 'src/modules/shared/priority.enum';
import type { RoleEnum } from 'src/modules/shared/role.enum';
import { DateOnly, dateOnlyJsonSchema } from 'src/utils/date-only';
import { toFullTextQuery } from 'src/utils/fulltext-search';
import { partition } from 'src/utils/iterables';
import { dateToTimeOnly, timeOnlySchema } from 'src/utils/time-only';

@Injectable()
export class ListNominationFilesQuery {
  constructor(
    private readonly db: Db,
    private readonly versionFinder: AffectationVersionFinder,
    private readonly jurisdictionsFinder: NominationFileJurisdictionsFinder,

    @Inject(forwardRef(() => DocsService))
    private readonly docs: DocsService,
  ) {}

  async handle(query: {
    sessionId: string;
    user: { id: string; role: RoleEnum };
    pagination: Pagination;
    sorting: Sortable<ListNominationFilesQueryDto>;
    filters: {
      missingEvaluation: boolean | undefined;
      nominationFileIds: readonly string[] | undefined;
      outcomes: readonly (NominationFileOutcomeEnum | null)[];
      priorities: readonly (PriorityEnum | null)[];
      reporterIds: readonly (string | null)[];
      search: string | null;
    };
  }): Promise<PaginatedNominationFiles> {
    const nominationFileIds = query.filters.nominationFileIds ? [...query.filters.nominationFileIds] : null;

    const [totalCount, items] = await this.db.withTransaction(async () => {
      const session = await this.findVisibleSession(query);
      if (!session) return [0, [] as NominationFileAffectationItem[]] as const;

      const where = ListNominationFilesQuery.filtersToPrismaWhere(
        query.filters,
        await this.lastVersion(query),
      );

      const [{ count: txCount } = { count: 0n }] = await this.db.tx.$queryRawTyped(
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
          where.missingEvaluation,
          nominationFileIds,
        ),
      );

      return [
        Number(txCount ?? 0n),
        await this.loadFiles({
          nominationFileIds,
          pagination: query.pagination,
          session,
          sessionId: query.sessionId,
          sorting: query.sorting,
          userId: query.user.id,
          where,
        }),
      ] as const;
    });

    return paginate({ items, totalCount, pagination: query.pagination });
  }

  /** @internal */
  async detail(query: {
    nominationFileId: string;
    sessionId: string;
    user: { id: string; role: RoleEnum };
  }): Promise<NominationFileAffectationItem | null> {
    const [file] = await this.db.withTransaction(async () => {
      const session = await this.findVisibleSession(query);
      if (!session) return [];

      return this.loadFiles({
        nominationFileIds: [query.nominationFileId],
        pagination: { page: 1, limit: 1 },
        session,
        sessionId: query.sessionId,
        sorting: { sortBy: undefined, sortDesc: false },
        userId: query.user.id,
        where: ListNominationFilesQuery.filtersToPrismaWhere(
          { outcomes: [], priorities: [], reporterIds: [], search: null },
          await this.lastVersion(query),
        ),
      });
    });

    return file ?? null;
  }

  private findVisibleSession(query: { sessionId: string; user: { role: RoleEnum } }) {
    return this.db.tx.session.findFirst({
      select: { archivedAt: true },
      where: { deletedAt: null, formation: roleToFormation(query.user.role), id: query.sessionId },
    });
  }

  private lastVersion(query: { sessionId: string; user: { role: RoleEnum } }) {
    const isSG = (['ADJOINT_SECRETAIRE_GENERAL', 'ADMIN'] as RoleEnum[]).includes(query.user.role);

    return isSG
      ? this.versionFinder.last({ sessionId: query.sessionId })
      : this.versionFinder.lastPublished({ sessionId: query.sessionId });
  }

  private async loadFiles(query: {
    nominationFileIds: string[] | null;
    pagination: { limit: number; page: number };
    session: { archivedAt: Date | null };
    sessionId: string;
    sorting: Sortable<ListNominationFilesQueryDto>;
    userId: string;
    where: NominationFilesWhere;
  }): Promise<NominationFileAffectationItem[]> {
    const { where } = query;

    const txFiles = await this.db.tx
      .$queryRawTyped(
        listNominationFilesRawQuery(
          where.versionId ?? null,
          query.userId,
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
          query.nominationFileIds,
          where.missingEvaluation,
        ),
      )
      .then((list) => RawListedNominationFiles.parseAsync(list));

    const nominationFileIds = new Set(txFiles.map(({ id }) => id));
    const linkedDocs = await this.docs.internalFindNominationFilesLinkedDocs({ nominationFileIds });

    const jurisdictions = await this.jurisdictionsFinder.find({
      nominationFileIds: [...nominationFileIds],
    });

    const sessionArchivedAt = query.session.archivedAt;
    const isArchived = !!sessionArchivedAt;

    const files = txFiles.map((file) => {
      const docs = linkedDocs.get(file.id) ?? [];
      return {
        ...file,
        jurisdictions: jurisdictions.get(file.id) ?? { current: null, targeted: null },
        status: transparenceFileStatus({ docs, outcome: file.outcome }),
        isUpdatable: nominationFilesPolicies.canUpdateNominationFile(
          { docs, id: file.id, outcome: file.outcome },
          { archivedAt: sessionArchivedAt },
        ),
      };
    });

    return files.map((x): NominationFileAffectationItem => {
      const auditionedPosition = {
        detectedJurisdictionId: x.detectedJurisdictionId ?? null,
        detectedTargetedFunctionId: x.detectedTargetedFunctionId ?? null,
        targetedPosition: x.targetedPosition,
      };

      return {
        id: x.id,
        isArchived,
        content: {
          version: 2,
          numeroDeDossier: x.number,
          nomMagistrat: x.name,
          grade: x.grade as GradeEnum,
          posteActuel: x.currentPosition,
          posteCible: x.targetedPosition,
          gradeCible: x.targetedGrade as GradeEnum,
          rang: x.rank,
          historique: x.biography,
          observants: x.observers,
          dateDeNaissance: DateOnly.fromOptionalUtcDate(x.birthDate)?.toJson() ?? null,
          dateEchéance: DateOnly.fromOptionalUtcDate(x.dueDate)?.toJson() ?? null,
          datePassageAuGrade: DateOnly.fromOptionalUtcDate(x.lastRankingDate)?.toJson() ?? null,
          datePriseDeFonctionPosteActuel: DateOnly.fromOptionalUtcDate(x.lastPositionDate)?.toJson() ?? null,
          informationCarrière: null,
          jurisdictions: x.jurisdictions,
          detectedMagistratId: x.detectedMagistratId ?? null,
          outcome: x.outcome
            ? {
                comment: x.outcomeComment,
                value: x.outcome as NominationFileOutcomeEnum,
              }
            : null,
          isAlertHidden: x.alertHidden,
          isUpdatable: x.isUpdatable,
          status: { ...x.status, date: DateOnly.fromOptionalUtcDate(x.status.date)?.toJson() ?? null },
        },
        priorities: x.priorities.map(prismaPrioriteEnumToPriorityEnum),
        comment: x.comment,
        canScheduleAudition: nominationFilesPolicies.canScheduleAudition(x, {
          archivedAt: sessionArchivedAt,
        }),
        auditionDate: DateOnly.fromOptionalUtcDate(x.auditionDate)?.toJson() ?? null,
        auditionExpected: isAuditionExpected(auditionedPosition),
        auditionTime: x.auditionTime ? dateToTimeOnly(x.auditionTime) : null,
        expectedReportersCount: expectedReportersCount(auditionedPosition),
        missingEvaluation: x.missingEvaluation,
        missingEvaluationComment: x.missingEvaluationComment,
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
            date: DateOnly.fromUtcDate(obs.dateReception).toJson(),
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
                  usedName: obs.magistrat.usedName,
                }
              : null,
          };
        }),
        memo: x.memberMemo || null,
        summary: x.summary
          ? {
              id: x.id,
              canWrite: x.summary.authorId === query.userId,
              canRead:
                x.summary.authorId === query.userId ||
                x.summary.readers.some((userId) => userId === query.userId),
            }
          : null,
        hasAttachment: x.hasAttachment,
      };
    });
  }

  private static filtersToPrismaWhere(
    filters: {
      missingEvaluation?: boolean | undefined;
      outcomes: readonly (NominationFileOutcomeEnum | null)[];
      priorities: readonly (PriorityEnum | null)[];
      reporterIds: readonly (string | null)[];
      search: string | null;
    },
    lastVersion: OptionalAffectationVersion,
  ): NominationFilesWhere {
    const [hasNoReporters, reporterIds] = partition(filters.reporterIds, (x) => x === null);
    const [hasNoPriorities, priorities] = partition(filters.priorities, (x) => x === null);
    const [hasNoOutcome, outcomes] = partition(filters.outcomes, (x) => x === null);

    return {
      versionId: lastVersion.optionalId,
      missingEvaluation: filters.missingEvaluation ?? null,
      reporterIds: reporterIds.length > 0 ? reporterIds : null,
      hasNoReporters: hasNoReporters.length > 0,
      priorities: priorities.length > 0 ? priorities.map(priorityEnumToPrismaPrioriteEnum) : null,
      hasNoPriorities: hasNoPriorities.length > 0,
      outcomes: outcomes.length > 0 ? outcomes : null,
      hasNoOutcome: hasNoOutcome.length > 0,
      search: filters.search?.trim() ? toFullTextQuery(filters.search) : null,
    };
  }
}

type NominationFilesWhere = {
  versionId: string | undefined;
  missingEvaluation: boolean | null;
  reporterIds: string[] | null;
  hasNoReporters: boolean;
  priorities: PrismaPrioriteEnum[] | null;
  hasNoPriorities: boolean;
  outcomes: NominationFileOutcomeEnum[] | null;
  hasNoOutcome: boolean;
  search: string | null;
};

const JurisdictionSchema = z.object({ id: z.string(), label: z.string().nullable() });

const NominationFileContentSchema = z.object({
  // open api generator does not support z.literal (json schema const)
  version: z.number().min(2).max(2).meta({ example: 2, description: 'always 2' }),
  nomMagistrat: z.string(),
  numeroDeDossier: z.number().nullable(),
  dateEchéance: dateOnlyJsonSchema.nullable(),
  grade: z.enum(GradeEnum).nullable(),
  posteActuel: z.string().nullable(),
  posteCible: z.string().nullable(),
  gradeCible: z.enum(GradeEnum),
  rang: z.string().nullable(),
  dateDeNaissance: dateOnlyJsonSchema.nullable(),
  historique: z.string().nullable(),
  observants: z.array(z.string()).nullable(),
  datePassageAuGrade: dateOnlyJsonSchema.nullable(),
  datePriseDeFonctionPosteActuel: dateOnlyJsonSchema.nullable(),
  informationCarrière: z.string().nullable(),
  jurisdictions: z.object({
    current: JurisdictionSchema.nullable(),
    targeted: JurisdictionSchema.nullable(),
  }),
  detectedMagistratId: z.string().nullable(),
  outcome: z
    .object({
      value: z.enum(NominationFileOutcome.enum),
      comment: z.string().nullable(),
    })
    .nullable(),
  isAlertHidden: z.boolean(),

  isUpdatable: z.boolean(),
  status: z.object({
    value: z.enum(NOMINATION_SESSION_FILE_STATUSES),
    date: dateOnlyJsonSchema.nullable(),
  }),
});

const RawListedNominationFiles = z.array(
  z.object({
    id: z.uuid(),
    priorities: z.array(z.enum(PrismaPrioriteEnum)).transform((x) => x.map(prismaPrioriteEnumToPriorityEnum)),
    comment: z.string().nullable(),
    auditionDate: z.date().nullable(),
    auditionTime: z.date().nullable(),
    biography: z.string().nullable(),
    birthDate: z.date().nullable(),
    currentPosition: z.string().nullable(),
    grade: z.enum(GradeEnum),
    lastPositionDate: z.date().nullable(),
    lastRankingDate: z.date().nullable(),
    name: z.string(),
    number: z.number().int().gt(0),
    observers: z.array(z.string()),
    rank: z.string().nullable(),
    targetedPosition: z.string().nullable(),
    targetedGrade: z.enum(GradeEnum).nullable(),
    dueDate: z.date().nullable(),
    outcome: z.enum(NominationFileOutcome.enum).nullable(),
    outcomeComment: z.string().nullable(),
    alertHidden: z.boolean(),
    missingEvaluation: z.boolean(),
    missingEvaluationComment: z.string().nullable(),
    detectedJurisdictionId: z.string().nullable(),
    detectedTargetedFunctionId: z.string().nullable(),
    detectedMagistratId: z.string().nullable(),
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
          magistrat: z.object({
            id: z.string(),
            firstName: z.string(),
            lastName: z.string(),
            usedName: z.string().nullable(),
          }),
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
  priorities: z.array(z.enum(PriorityEnum)),
  content: NominationFileContentSchema,
  comment: z.string().nullable(),
  canScheduleAudition: z.boolean(),
  auditionDate: dateOnlyJsonSchema.nullable(),
  auditionExpected: z.boolean(),
  auditionTime: timeOnlySchema.nullable(),
  expectedReportersCount: z.number().nullable(),
  missingEvaluation: z.boolean(),
  missingEvaluationComment: z.string().nullable(),
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
  memo: z.string().nullable(),
  summary: z.object({ id: z.string(), canRead: z.boolean(), canWrite: z.boolean() }).nullable(),
  hasAttachment: z.boolean(),
});

export type NominationFileAffectationItem = z.infer<typeof NominationFileAffectationItemSchema>;

export class PaginatedNominationFiles extends createPaginatedZodDto(NominationFileAffectationItemSchema) {}

export class DetailedNominationFileDto extends createZodDto(NominationFileAffectationItemSchema) {}
