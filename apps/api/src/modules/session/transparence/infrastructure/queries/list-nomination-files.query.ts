import assert from 'node:assert';

import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import {
  NOMINATION_SESSION_FILE_STATUSES,
  transparenceFileStatus,
} from '../../domain/session-transparence-file-status';
import { ListNominationFilesQueryDto } from '../dtos/nomination-file.dto';
import { AffectationVersionFinder, OptionalAffectationVersion } from '../finders/affectation-version.finder';
import { AuditionsSeenFinder } from '../finders/auditions-seen.finder';
import { NominationFileJurisdictionsFinder } from '../finders/nomination-file-jurisdictions.finder';
import { SessionReportedFilesFinder } from '../finders/session-reported-files.finder';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaPrioriteEnum } from 'src/generated/prisma/enums';
import { listNominationFilesCountRawQuery, listNominationFilesRawQuery } from 'src/generated/prisma/sql';
import { DocsService } from 'src/modules/docs/docs.service';
import { Db } from 'src/modules/framework/database';
import { createPaginatedZodDto, paginate, Pagination } from 'src/modules/framework/pagination';
import { Sortable } from 'src/modules/framework/sorting';
import { roleToFormation } from 'src/modules/members/infrastructure/member.utils';
import { ObservationFollowUp } from 'src/modules/observation/domain/observation-follow-up';
import { ObservationService } from 'src/modules/observation/observation.service';
import { GradeEnum } from 'src/modules/shared/grade.enum';
import {
  priorityEnumToPrismaPrioriteEnum,
  prismaPrioriteEnumToPriorityEnum,
} from 'src/modules/shared/mappers/priorite.mapper';
import { NominationFileLockEnum } from 'src/modules/shared/nomination-file-lock.enum';
import {
  NominationFileOutcome,
  NominationFileOutcomeEnum,
} from 'src/modules/shared/nomination-file-outcome.enum';
import {
  AUDITION_REQUIREMENTS,
  expectedReportersCount,
} from 'src/modules/shared/policies/auditioned-position.policy';
import * as nominationFilesPolicies from 'src/modules/shared/policies/nomination-file.policies';
import { PriorityEnum } from 'src/modules/shared/priority.enum';
import { isSecretariat, type RoleEnum } from 'src/modules/shared/role.enum';
import { auditionScheduleSchema } from 'src/utils/audition-schedule';
import { DateOnly, dateOnlyJsonSchema } from 'src/utils/date-only';
import { toFullTextQuery } from 'src/utils/fulltext-search';
import { partition } from 'src/utils/iterables';
import { timeOnlySchema } from 'src/utils/time-only';

@Injectable()
export class ListNominationFilesQuery {
  constructor(
    private readonly auditionsSeen: AuditionsSeenFinder,
    private readonly db: Db,
    private readonly versionFinder: AffectationVersionFinder,
    private readonly jurisdictionsFinder: NominationFileJurisdictionsFinder,

    @Inject(forwardRef(() => DocsService))
    private readonly docs: DocsService,
    private readonly reportedFiles: SessionReportedFilesFinder,
    @Inject(forwardRef(() => ObservationService))
    private readonly observations: ObservationService,
  ) {}

  async handle(query: {
    pagination: Pagination;
    sessionId: string;
    sorting: Sortable<ListNominationFilesQueryDto>;
    user: { id: string; role: RoleEnum };
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
          user: query.user,
          where,
        }),
      ] as const;
    });

    return paginate({ items, pagination: query.pagination, totalCount });
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
        pagination: { limit: 1, page: 1 },
        session,
        sessionId: query.sessionId,
        sorting: { sortBy: undefined, sortDesc: false },
        user: query.user,
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
      select: { archivedAt: true } satisfies Prisma.SessionSelect,
      where: { deletedAt: null, formation: roleToFormation(query.user.role), id: query.sessionId },
    });
  }

  private lastVersion(query: { sessionId: string; user: { role: RoleEnum } }) {
    return isSecretariat(query.user.role)
      ? this.versionFinder.last({ sessionId: query.sessionId })
      : this.versionFinder.lastPublished({ sessionId: query.sessionId });
  }

  private async loadFiles(query: {
    nominationFileIds: string[] | null;
    pagination: { limit: number; page: number };
    session: { archivedAt: Date | null };
    sessionId: string;
    sorting: Sortable<ListNominationFilesQueryDto>;
    user: { id: string; role: RoleEnum };
    where: NominationFilesWhere;
  }): Promise<NominationFileAffectationItem[]> {
    const { where } = query;

    const txFiles = await this.db.tx
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
          query.nominationFileIds,
          where.missingEvaluation,
        ),
      )
      .then((list) => RawListedNominationFiles.parseAsync(list));

    const nominationFileIds = new Set(txFiles.map(({ id }) => id));
    const linkedDocs = await this.docs.internalFindNominationFilesLinkedDocs({ nominationFileIds });
    const reportedFileIds = await this.reportedFiles.find({ nominationFileIds });
    const auditions = await this.auditionsSeen.findNominationFiles({
      nominationFileIds: [...nominationFileIds],
      role: query.user.role,
    });
    const observations = await this.observations.internalFindNominationFilesObservations({
      nominationFileIds,
      userId: query.user.id,
    });
    const observantAuditions = await this.auditionsSeen.findObservants({
      magistratIds: [
        ...new Set([...observations.values()].flatMap((list) => list.map(({ magistrat }) => magistrat.id))),
      ],
      role: query.user.role,
      sessionId: query.sessionId,
    });

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
        lockedReason: nominationFilesPolicies.nominationFileLock(
          { isReported: reportedFileIds.has(file.id) },
          { archivedAt: sessionArchivedAt },
        ),
        status: transparenceFileStatus({ docs, outcome: file.outcome }),
      };
    });

    return files.map((x): NominationFileAffectationItem => {
      const auditionedPosition = {
        detectedJurisdictionId: x.detectedJurisdictionId ?? null,
        detectedJurisdictionType: x.detectedJurisdictionType ?? null,
        detectedTargetedFunctionId: x.detectedTargetedFunctionId ?? null,
        targetedPosition: x.targetedPosition,
      };

      const audition = auditions.get(x.id);
      assert.ok(audition, `no audition seen for the nomination file ${x.id}`);

      return {
        ...audition,
        canScheduleAudition: nominationFilesPolicies.canScheduleAudition(x, {
          archivedAt: sessionArchivedAt,
        }),
        comment: x.comment,
        content: {
          dateDeNaissance: DateOnly.fromOptionalUtcDate(x.birthDate)?.toJson() ?? null,
          dateEchéance: DateOnly.fromOptionalUtcDate(x.dueDate)?.toJson() ?? null,
          datePassageAuGrade: DateOnly.fromOptionalUtcDate(x.lastRankingDate)?.toJson() ?? null,
          datePriseDeFonctionPosteActuel: DateOnly.fromOptionalUtcDate(x.lastPositionDate)?.toJson() ?? null,
          detectedMagistratId: x.detectedMagistratId ?? null,
          grade: x.grade as GradeEnum,
          gradeCible: x.targetedGrade as GradeEnum,
          historique: x.biography,
          informationCarrière: null,
          isAlertHidden: x.alertHidden,
          jurisdictions: x.jurisdictions,
          lockedReason: x.lockedReason,
          nomMagistrat: x.name,
          numeroDeDossier: x.number,
          observants: x.observers,
          outcome: x.outcome
            ? {
                comment: x.outcomeComment,
                value: x.outcome as NominationFileOutcomeEnum,
              }
            : null,
          posteActuel: x.currentPosition,
          posteCible: x.targetedPosition,
          rang: x.rank,
          status: {
            dates: x.status.dates.map((date) => DateOnly.fromUtcDate(date).toJson()),
            value: x.status.value,
          },
          version: 2,
        },
        expectedReportersCount: expectedReportersCount(auditionedPosition),
        hasAttachment: x.hasAttachment,
        hasJurisdictionSheet: x.hasJurisdictionSheet,
        id: x.id,
        isArchived,
        memo: x.memberMemo || null,
        missingEvaluation: x.missingEvaluation,
        missingEvaluationComment: x.missingEvaluationComment,
        observations: (observations.get(x.id) ?? []).map((obs) => ({
          audition: observantAuditions.get(obs.magistrat.id) ?? null,
          date: DateOnly.fromUtcDate(obs.dateReception).toJson(),
          followUp: obs.followUp,
          followUpComment: obs.followUp ? obs.followUpComment : null,
          hasDescription: !!obs.description.trim(),
          hasUserComment: obs.hasUserComment,
          id: obs.id,
          magistrat: obs.magistrat,
        })),
        priorities: x.priorities.map(prismaPrioriteEnumToPriorityEnum),
        reporters: x.reporters.map(({ user: { id, firstName, lastName } }) => ({
          firstName,
          id,
          lastName,
        })),
        summary: x.summary
          ? {
              canRead:
                x.summary.authorId === query.user.id ||
                x.summary.readers.some((userId) => userId === query.user.id),
              canWrite: x.summary.authorId === query.user.id,
              id: x.id,
            }
          : null,
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
      hasNoOutcome: hasNoOutcome.length > 0,
      hasNoPriorities: hasNoPriorities.length > 0,
      hasNoReporters: hasNoReporters.length > 0,
      missingEvaluation: filters.missingEvaluation ?? null,
      outcomes: outcomes.length > 0 ? outcomes : null,
      priorities: priorities.length > 0 ? priorities.map(priorityEnumToPrismaPrioriteEnum) : null,
      reporterIds: reporterIds.length > 0 ? reporterIds : null,
      search: filters.search?.trim() ? toFullTextQuery(filters.search) : null,
      versionId: lastVersion.optionalId,
    };
  }
}

type NominationFilesWhere = {
  hasNoOutcome: boolean;
  hasNoPriorities: boolean;
  hasNoReporters: boolean;
  missingEvaluation: boolean | null;
  outcomes: NominationFileOutcomeEnum[] | null;
  priorities: PrismaPrioriteEnum[] | null;
  reporterIds: string[] | null;
  search: string | null;
  versionId: string | undefined;
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

  lockedReason: z.enum(NominationFileLockEnum).nullable(),
  status: z.object({
    value: z.enum(NOMINATION_SESSION_FILE_STATUSES),
    dates: z.array(dateOnlyJsonSchema),
  }),
});

const RawListedNominationFiles = z.array(
  z.object({
    id: z.uuid(),
    priorities: z.array(z.enum(PrismaPrioriteEnum)).transform((x) => x.map(prismaPrioriteEnumToPriorityEnum)),
    comment: z.string().nullable(),
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
    detectedJurisdictionType: z.string().nullable(),
    detectedTargetedFunctionId: z.string().nullable(),
    detectedMagistratId: z.string().nullable(),
    hasAttachment: z.boolean(),
    hasJurisdictionSheet: z.boolean(),
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
  auditionRequired: z.boolean(),
  auditionRequirement: z.enum(AUDITION_REQUIREMENTS).nullable(),
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
      audition: auditionScheduleSchema.nullable(),
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
  hasJurisdictionSheet: z.boolean(),
});

export type NominationFileAffectationItem = z.infer<typeof NominationFileAffectationItemSchema>;

export class PaginatedNominationFiles extends createPaginatedZodDto(NominationFileAffectationItemSchema) {}

export class DetailedNominationFileDto extends createZodDto(NominationFileAffectationItemSchema) {}
