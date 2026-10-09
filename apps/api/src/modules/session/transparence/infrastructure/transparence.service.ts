import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable, Logger, NotFoundException, StreamableFile } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as Sentry from '@sentry/node';

import { SessionTransparence } from '../domain/session-transparence';
import { LodamTransparenceFile } from '../domain/transparence-file';
import { Prisma } from 'src/generated/prisma/client';
import { DocInvalidatedIntegrationEvent } from 'src/modules/docs/shared/domain/invalidation/official-report-invalidated.integration-event';
import { Db } from 'src/modules/framework/database';
import { Pagination } from 'src/modules/framework/pagination';
import { Sortable } from 'src/modules/framework/sorting';
import { MembersService } from 'src/modules/members';
import { roleToFormation } from 'src/modules/members/infrastructure/member.utils';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { NominationFileAttachmentTypeEnum } from 'src/modules/shared/nomination-file-attachment-type.enum';
import {
  NominationFileOutcome,
  NominationFileOutcomeEnum,
} from 'src/modules/shared/nomination-file-outcome.enum';
import * as policies from 'src/modules/shared/policies/nomination-file.policies';
import { PriorityEnum } from 'src/modules/shared/priority.enum';
import type { RoleEnum } from 'src/modules/shared/role.enum';
import { TypeDeSaisineEnum } from 'src/modules/shared/type-de-saisine.enum';
import type { AuditionSchedule } from 'src/utils/audition-schedule';
import { DateOnly } from 'src/utils/date-only';
import { isDefined } from 'src/utils/is-defined';
import { TimeOnly } from 'src/utils/time-only';

import { ListNominationFilesQueryDto } from './dtos/nomination-file.dto';
import { CountedSessionAuditionsDto, ListedSessionAuditionsDto } from './dtos/session-audition.dto';
import { ListGdsNominationSessionsQueryDto } from './dtos/transparence-session.dto';
import {
  AffectationVersionFinder,
  FoundAffectationVersion,
  OptionalAffectationVersion,
} from './finders/affectation-version.finder';
import { AuditionPublicationFinder } from './finders/audition-publication.finder';
import { AuditionsSeenFinder, type SeenAudition } from './finders/auditions-seen.finder';
import { AutoAffectationsFinder } from './finders/auto-affectations.finder';
import {
  type HydratedNominationFile,
  type FoundNominationFile,
  HydratedNominationFilesFinder,
} from './finders/hydrated-nomination-files.finder';
import { LolfiNominationSessionFinder } from './finders/lolfi-nomination-session.finder';
import { NominationFileOutcomesFinder } from './finders/nomination-file-outcomes.finder';
import {
  type NominationFileProgress,
  NominationFilesProgressFinder,
} from './finders/nomination-files-progress.finder';
import { ReportedSessionsFinder } from './finders/reported-sessions.finder';
import { ReportersAffectationFinder } from './finders/reporters-affectation.finder';
import { SynchronisedLolfiSessionsFinder } from './finders/synchronised-lolfi-sessions.finder';
import { TransparenceFilesFinder } from './finders/transparence-files.finder';
import {
  type FoundNominationSession,
  NominationSessionFinder,
  type NominationSessionState,
} from './finders/transparence-session.finder';
import {
  CountNominationFilesByStatusQuery,
  NominationFilesStatusCountDto,
} from './queries/count-nomination-files-by-status.query';
import { CountSessionAuditionsQuery } from './queries/count-session-auditions.query';
import { CountedUnaffectedFilesDto, CountUnaffectedFilesQuery } from './queries/count-unaffected-files.query';
import {
  CountUsersNewSessionsDto,
  CountUsersNewSessionsQuery,
} from './queries/count-users-new-sessions.query';
import {
  DetailAffectationHistoryQuery,
  DetailedAffectationHistoryDto,
} from './queries/detail-affectation-history.query';
import {
  DetailAuditionsPublicationQuery,
  DetailedAuditionsPublicationDto,
} from './queries/detail-auditions-publication.query';
import {
  type DetailedNominationFileAttachmentDto,
  DetailNominationFileAttachmentQuery,
} from './queries/detail-nomination-file-attachment.query';
import {
  DetailedNominationFileAuditionHistoryDto,
  DetailNominationFileAuditionHistoryQuery,
} from './queries/detail-nomination-file-audition-history.query';
import { DetailNominationSessionAffectationVersionQuery } from './queries/detail-nomination-session-affectation-version.query';
import {
  type DetailedNominationSessionAttachmentDto,
  DetailNominationSessionAttachmentQuery,
} from './queries/detail-nomination-session-attachment.query';
import {
  type DetailedNominationSessionDto,
  DetailNominationSessionQuery,
} from './queries/detail-nomination-session.query';
import {
  type DetailedSessionCommentDto,
  DetailSessionCommentQuery,
} from './queries/detail-session-comment.query';
import { GetLolfiMagistratUrlQuery, LolfiMagistratUrlDto } from './queries/get-lolfi-magistrat-url.query';
import {
  InternalFindDocsNominationFilesQuery,
  InternalFoundAgendaNominationFiles,
} from './queries/internal-find-docs-nomination-files.query';
import { InternalListMagistratNominationFilesQuery } from './queries/internal-list-magistrat-nomination-files.query';
import {
  ListArchivedNominationSessionsQuery,
  ListedArchivedNominationSessionsDto,
} from './queries/list-archived-nomination-sessions.query';
import {
  ListCurrentlyAffectedReportersQuery,
  ListedCurrentlyAffectedReportersDto,
} from './queries/list-currently-affected-reporters.query';
import { ListMemberSessionsQuery, type ListedMemberSessionsDto } from './queries/list-member-sessions.query';
import { ListMissingEvaluationsAsExcelQuery } from './queries/list-missing-evaluations-as-excel.query';
import {
  type ListedNominationFileAttachmentDto,
  ListNominationFileAttachmentsQuery,
} from './queries/list-nomination-file-attachments.query';
import { ListNominationFilesAsExcelQuery } from './queries/list-nomination-files-as-excel.query';
import {
  type DetailedNominationFileDto,
  ListNominationFilesQuery,
  type PaginatedNominationFiles,
} from './queries/list-nomination-files.query';
import {
  type ListedNominationSessionAttachmentDto,
  ListNominationSessionAttachmentsQuery,
} from './queries/list-nomination-session-attachments.query';
import {
  ListedNominationSessionsDto,
  ListNominationSessionsQuery,
} from './queries/list-nomination-sessions.query';
import { ListSessionAuditionsAsExcelQuery } from './queries/list-session-auditions-as-excel.query';
import { ListSessionAuditionsQuery } from './queries/list-session-auditions.query';
import { SessionTransparenceRepository } from './repositories/session-transparence.repository';

@Injectable()
export class TransparenceService {
  private readonly logger = new Logger(TransparenceService.name);
  constructor(
    private readonly members: MembersService,
    private readonly auditionPublications: AuditionPublicationFinder,
    private readonly auditionsSeen: AuditionsSeenFinder,
    private readonly autoAffectationsFinder: AutoAffectationsFinder,
    private readonly detailAuditionsPublicationQuery: DetailAuditionsPublicationQuery,
    private readonly detailNominationFileAuditionHistoryQuery: DetailNominationFileAuditionHistoryQuery,
    private readonly detailNominationFileAttachmentQuery: DetailNominationFileAttachmentQuery,
    private readonly detailAffectationHistoryQuery: DetailAffectationHistoryQuery,
    private readonly detailNominationSessionAffectationVersionQuery: DetailNominationSessionAffectationVersionQuery,
    private readonly detailNominationSessionAttachmentQuery: DetailNominationSessionAttachmentQuery,
    private readonly detailNominationSessionQuery: DetailNominationSessionQuery,
    private readonly detailSessionCommentQuery: DetailSessionCommentQuery,
    private readonly getLolfiMagistratUrlQuery: GetLolfiMagistratUrlQuery,
    private readonly hydratedNominationFiles: HydratedNominationFilesFinder,
    private readonly internalListMagistratNominationFilesQuery: InternalListMagistratNominationFilesQuery,
    private readonly listMemberSessionsQuery: ListMemberSessionsQuery,
    private readonly internalFindNominationFilesQuery: InternalFindDocsNominationFilesQuery,
    private readonly listNominationFileAttachmentsQuery: ListNominationFileAttachmentsQuery,
    private readonly listNominationFilesQuery: ListNominationFilesQuery,
    private readonly listNominationSessionAttachmentsQuery: ListNominationSessionAttachmentsQuery,
    private readonly listNominationSessionsQuery: ListNominationSessionsQuery,
    private readonly listArchivedNominationSessionsQuery: ListArchivedNominationSessionsQuery,
    private readonly nominationSessionFileFinder: TransparenceFilesFinder,
    private readonly nominationSessionRepository: SessionTransparenceRepository,
    private readonly listCurrentlyAffectedReportersQuery: ListCurrentlyAffectedReportersQuery,
    private readonly countUnaffectedFilesQuery: CountUnaffectedFilesQuery,
    private readonly countNominationFilesByStatusQuery: CountNominationFilesByStatusQuery,
    private readonly countUsersNewSessionsQuery: CountUsersNewSessionsQuery,
    private readonly countSessionAuditionsQuery: CountSessionAuditionsQuery,
    private readonly listMissingEvaluationsAsExcelQuery: ListMissingEvaluationsAsExcelQuery,
    private readonly listSessionAuditionsAsExcelQuery: ListSessionAuditionsAsExcelQuery,
    private readonly listSessionAuditionsQuery: ListSessionAuditionsQuery,
    private readonly listNominationFilesAsExcelQuery: ListNominationFilesAsExcelQuery,
    private readonly lolfiNominationSessionFinder: LolfiNominationSessionFinder,
    private readonly db: Db,
    private readonly versions: AffectationVersionFinder,
    private readonly sessionsFinder: NominationSessionFinder,
    private readonly nominationFileOutcomesFinder: NominationFileOutcomesFinder,
    private readonly nominationFilesProgressFinder: NominationFilesProgressFinder,
    private readonly synchronisedLolfiSessionsFinder: SynchronisedLolfiSessionsFinder,
    private readonly reportedSessionsFinder: ReportedSessionsFinder,
    private readonly reportersAffectation: ReportersAffectationFinder,

    private readonly events: EventEmitter2,
  ) {}

  /** @internal */
  internalFindSeenNominationFileAudition(query: {
    nominationFileId: string;
    role: RoleEnum;
  }): Promise<SeenAudition> {
    return this.auditionsSeen.findNominationFile(query);
  }

  /** @internal */
  internalFindSeenObservantAuditions(query: {
    magistratIds: readonly string[];
    role: RoleEnum;
    sessionId: string;
  }): Promise<Map<string, AuditionSchedule>> {
    return this.auditionsSeen.findObservants(query);
  }

  /** @internal */
  internalFindAuditionStates(query: {
    nominationFileIds: readonly string[];
    sessionId: string;
  }): Promise<{ allowsAudition: boolean; isLocked: boolean }[]> {
    // an empty set would load every nomination file of the session
    if (!query.nominationFileIds.length) return Promise.resolve([]);

    return this.nominationSessionFileFinder
      .findSnapshots({ nominationFileIds: new Set(query.nominationFileIds), sessionId: query.sessionId })
      .then((files) =>
        files.map((file) => ({
          allowsAudition: policies.canScheduleAudition(file, { archivedAt: null }),
          isLocked: !!policies.nominationFileLock(file, { archivedAt: null }),
        })),
      );
  }

  /** @internal */
  internalFindReportersAffectation(query: {
    nominationFileId: string;
    sessionId: string;
  }): Promise<{ isLocked: boolean; reportersCount: number }> {
    return this.reportersAffectation.find(query);
  }

  listMemberSessions(query: {
    typeDeSaisine: TypeDeSaisineEnum;
    user: { id: string; role: RoleEnum };
  }): Promise<ListedMemberSessionsDto> {
    return this.listMemberSessionsQuery.handle(query);
  }

  /** @internal */
  async assertMemberSessionExists(query: {
    sessionId: string;
    typeDeSaisine: TypeDeSaisineEnum;
    user: { role: RoleEnum };
  }): Promise<void> {
    const session = await this.db.tx.session.findFirst({
      select: { id: true } satisfies Prisma.SessionSelect,
      where: {
        deletedAt: null,
        formation: roleToFormation(query.user.role),
        id: query.sessionId,
        typeDeSaisine: query.typeDeSaisine,
      },
    });
    if (!session) throw new NotFoundException();
  }

  @Transactional()
  async affectReportersAndPriorities(command: {
    authorId: string;
    sessionId: string;
    affectations: readonly {
      nominationFileId: string;
      priorities: PriorityEnum[];
      reporterIds: readonly string[];
    }[];
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(command.sessionId, {
      nominationFileIds: new Set(command.affectations.map(({ nominationFileId }) => nominationFileId)),
    });

    const memberIds = Array.from(
      new Set(command.affectations.flatMap((affectation) => affectation.reporterIds)),
    );

    const formationMemberIds = await this.members
      .findMembers({ formation: session.formation, ids: memberIds })
      .then((ids) => new Set(ids));

    session.affectNominationFileReporters({ ...command, formationMemberIds });

    for (const item of command.affectations) {
      session.setNominationFilePriority({
        nominationFileId: item.nominationFileId,
        priorities: item.priorities,
      });
    }

    await this.nominationSessionRepository.persist(session);
  }

  async listNominationFiles(query: {
    pagination: Pagination;
    sessionId: string;
    sorting: Sortable<ListNominationFilesQueryDto>;
    user: { role: RoleEnum; id: string };
    filters: {
      missingEvaluation: boolean | undefined;
      nominationFileIds: readonly string[] | undefined;
      outcomes: readonly (NominationFileOutcomeEnum | null)[];
      priorities: readonly (PriorityEnum | null)[];
      reporterIds: readonly (string | null)[];
      search: string | null;
    };
  }): Promise<PaginatedNominationFiles> {
    return this.listNominationFilesQuery.handle(query);
  }

  async detailNominationFile(query: {
    nominationFileId: string;
    sessionId: string;
    user: { role: RoleEnum; id: string };
  }): Promise<DetailedNominationFileDto> {
    const file = await this.listNominationFilesQuery.detail(query);
    if (!file) throw new NotFoundException();

    return file;
  }

  detailAffectationHistory(query: { sessionId: string }): Promise<DetailedAffectationHistoryDto> {
    return this.detailAffectationHistoryQuery.handle(query);
  }

  detailNominationSessionAffectationsVersion(query: { sessionId: string }): Promise<FoundAffectationVersion> {
    return this.detailNominationSessionAffectationVersionQuery.handle(query);
  }

  async publishNominationSessionAffectationsVersion(command: {
    sessionId: string;
    userId: string;
  }): Promise<void> {
    const invalidations = await this.db.withTransaction(async () => {
      const session = await this.nominationSessionRepository.find(command.sessionId);
      session.publishAffectationVersion({ userId: command.userId });
      return this.nominationSessionRepository.persist(session);
    });

    for (const invalidation of invalidations) {
      await this.events.emitAsync(
        DocInvalidatedIntegrationEvent.name,
        new DocInvalidatedIntegrationEvent(invalidation),
      );
    }
  }

  @Transactional()
  async autoAffectation(command: {
    authorId: string;
    excludedMemberIds: readonly string[] | undefined;
    nominationFileIds: readonly string[] | undefined;
    sessionId: string;
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(command.sessionId, {
      nominationFileIds: new Set(command.nominationFileIds),
    });

    const autoAffectations = await this.autoAffectationsFinder.find({
      excludedMemberIds: command.excludedMemberIds,
      nominationFileIds: command.nominationFileIds,
      sessionId: command.sessionId,
    });

    const formationMemberIds = await this.members
      .findMembers({ formation: session.formation, ids: undefined })
      .then((ids) => new Set(ids));

    session.autoAffectNominationFileReporters({
      authorId: command.authorId,
      autoAffectations,
      formationMemberIds,
    });
    await this.nominationSessionRepository.persist(session);
  }

  async updateNominationFileComment(command: {
    comment: string | null;
    nominationFileId: string;
    sessionId: string;
  }): Promise<void> {
    await this.db.tx.dossierDeNomination.update({
      data: { comment: command.comment },
      where: {
        id: command.nominationFileId,
        sessionId: command.sessionId,
      },
    });
  }

  @Transactional()
  async updateNominationFileMissingEvaluation(command: {
    missingEvaluation: boolean;
    nominationFileId: string;
    sessionId: string;
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(command.sessionId, {
      nominationFileIds: new Set([command.nominationFileId]),
    });

    session.updateMissingEvaluation({
      missingEvaluation: command.missingEvaluation,
      nominationFileId: command.nominationFileId,
    });

    await this.nominationSessionRepository.persist(session);
  }

  @Transactional()
  async updateNominationFileMissingEvaluationComment(command: {
    comment: string | null;
    nominationFileId: string;
    sessionId: string;
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(command.sessionId, {
      nominationFileIds: new Set([command.nominationFileId]),
    });

    session.updateMissingEvaluationComment({
      comment: command.comment,
      nominationFileId: command.nominationFileId,
    });

    await this.nominationSessionRepository.persist(session);
  }

  @Transactional()
  async publishAuditions(command: { impersonatorId: string | null; sessionId: string; userId: string }) {
    const session = await this.nominationSessionRepository.find(command.sessionId);
    session.publishAuditions({
      ...command,
      auditions: await this.auditionPublications.current(command),
      lastPublished: (await this.auditionPublications.last(command))?.auditions ?? null,
    });
    await this.nominationSessionRepository.persist(session);
  }

  detailNominationFileAuditionHistory(query: {
    nominationFileId: string;
    sessionId: string;
  }): Promise<DetailedNominationFileAuditionHistoryDto> {
    return this.detailNominationFileAuditionHistoryQuery.handle(query);
  }

  detailAuditionsPublication(query: { sessionId: string }): Promise<DetailedAuditionsPublicationDto> {
    return this.detailAuditionsPublicationQuery.handle(query);
  }

  @Transactional()
  async updateNominationFileAuditionRequest(command: {
    impersonatorId: string | null;
    nominationFileId: string;
    requested: boolean;
    sessionId: string;
    userId: string;
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(command.sessionId, {
      nominationFileIds: new Set([command.nominationFileId]),
    });
    session.defineAuditionRequest(command);
    await this.nominationSessionRepository.persist(session);
  }

  @Transactional()
  async updateNominationFileAuditionDate(command: {
    auditionDateTime: { date: DateOnly; time: TimeOnly } | null;
    impersonatorId: string | null;
    nominationFileId: string;
    sessionId: string;
    userId: string;
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(command.sessionId, {
      nominationFileIds: new Set([command.nominationFileId]),
    });

    if (!isDefined(command.auditionDateTime)) {
      session.unscheduleAudition(command);
    } else {
      session.scheduleAudition({ ...command, auditionDateTime: command.auditionDateTime });
    }

    await this.nominationSessionRepository.persist(session);
  }

  @Transactional()
  async createNominationSessionFromLodam(command: {
    date: DateOnly;
    dueDate: DateOnly | null;
    files: readonly LodamTransparenceFile[];
    formation: FormationEnum;
    name: string;
    observationClosingDate: DateOnly;
    positionStartDate: DateOnly | null;
    userId: string;
  }): Promise<{ id: string }> {
    const fullNames = command.files.flatMap(({ reporters }) => reporters);
    const members = await this.members.findMembersByFullName({
      formation: command.formation,
      fullNames,
    });

    const session = SessionTransparence.createLodamNominationTreeAndAffectMembers({
      ...command,
      formationMembers: members,
      typeDeSaisine: 'TRANSPARENCE_GDS',
    });
    await this.nominationSessionRepository.persist(session);

    return { id: session.id };
  }

  @Transactional()
  async updateSessionNominationFileObservers(command: {
    files: readonly LodamTransparenceFile[];
    sessionId: string;
  }): Promise<void> {
    const existingNominationFiles = await this.nominationSessionFileFinder.bySessionAndFileNumber({
      fileNumbers: command.files.map(({ fileNumber }) => fileNumber),
      sessionId: command.sessionId,
    });

    const session = await this.nominationSessionRepository.find(command.sessionId, {
      nominationFileIds: new Set(existingNominationFiles.map(({ id }) => id)),
    });

    session.updateNominationFileObservers({
      existingNominationFiles,
      nominationFiles: command.files,
    });
    await this.nominationSessionRepository.persist(session);
  }

  @Transactional()
  async addNominationSessionAttachments(command: {
    files: { id: string }[];
    sessionId: string;
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(command.sessionId);

    session.addAttachments({ files: command.files });
    await this.nominationSessionRepository.persist(session);
  }

  @Transactional()
  async removeNominationSessionAttachment(command: { sessionId: string; fileId: string }): Promise<void> {
    const session = await this.nominationSessionRepository.find(command.sessionId);

    session.removeAttachment({ fileId: command.fileId });
    await this.nominationSessionRepository.persist(session);
  }

  @Transactional()
  async addNominationFileAttachments(command: {
    files: { id: string }[];
    nominationFileId: string;
    sessionId: string;
    type: NominationFileAttachmentTypeEnum;
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(command.sessionId);

    session.addNominationFileAttachments({
      files: command.files,
      nominationFileId: command.nominationFileId,
      type: command.type,
    });
    await this.nominationSessionRepository.persist(session);
  }

  @Transactional()
  async removeNominationFileAttachment(command: {
    fileId: string;
    nominationFileId: string;
    sessionId: string;
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(command.sessionId);

    session.removeNominationFileAttachment({
      fileId: command.fileId,
      nominationFileId: command.nominationFileId,
    });
    await this.nominationSessionRepository.persist(session);
  }

  listNominationFileAttachments(query: {
    nominationFileId: string;
    sessionId: string;
  }): Promise<ListedNominationFileAttachmentDto> {
    return this.listNominationFileAttachmentsQuery.handle(query);
  }

  detailNominationFileAttachment(query: {
    fileId: string;
    nominationFileId: string;
    sessionId: string;
  }): Promise<DetailedNominationFileAttachmentDto> {
    return this.detailNominationFileAttachmentQuery.handle(query);
  }

  listAttachments(query: { sessionId: string }): Promise<ListedNominationSessionAttachmentDto> {
    return this.listNominationSessionAttachmentsQuery.handle(query);
  }

  detailAttachment(query: {
    fileId: string;
    sessionId: string;
  }): Promise<DetailedNominationSessionAttachmentDto> {
    return this.detailNominationSessionAttachmentQuery.handle(query);
  }

  details(query: {
    /** undefined means no restriction on the formation */
    formation: FormationEnum | undefined;
    sessionId: string;
  }): Promise<DetailedNominationSessionDto> {
    return this.detailNominationSessionQuery.handle(query);
  }

  async update(command: {
    sessionId: string;
    data: {
      date: DateOnly;
      dueDate: DateOnly | null;
      name: string;
      observationsClosingDate: DateOnly;
      positionStartDate: DateOnly | null;
    };
  }): Promise<void> {
    const invalidations = await this.db.withTransaction(async () => {
      const session = await this.nominationSessionRepository.find(command.sessionId);
      session.update(command.data);
      return this.nominationSessionRepository.persist(session);
    });

    for (const invalidation of invalidations) {
      await this.events.emitAsync(
        DocInvalidatedIntegrationEvent.name,
        new DocInvalidatedIntegrationEvent(invalidation),
      );
    }
  }

  detailComment(query: { sessionId: string }): Promise<DetailedSessionCommentDto> {
    return this.detailSessionCommentQuery.handle(query);
  }

  @Transactional()
  async writeComment(command: {
    comment: string;
    impersonatorId: string | null;
    sessionId: string;
    userId: string;
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(command.sessionId);
    session.writeComment(command);
    await this.nominationSessionRepository.persist(session);
  }

  /** @internal */
  internalFindComments(query: { sessionIds: readonly string[] }): Promise<Map<string, string | null>> {
    return this.sessionsFinder.comments(query);
  }

  listArchivedSessions(query: {
    formations: readonly FormationEnum[] | undefined;
    pagination: Pagination;
    search: string | null;
    sorting: Sortable<ListGdsNominationSessionsQueryDto>;
    typeDeSaisine: TypeDeSaisineEnum;
  }): Promise<ListedArchivedNominationSessionsDto> {
    return this.listArchivedNominationSessionsQuery.handle(query);
  }

  listNominationSessions(query: {
    formations: readonly FormationEnum[] | undefined;
    pagination: Pagination;
    search: string | null;
    sorting: Sortable<ListGdsNominationSessionsQueryDto>;
    typeDeSaisine: TypeDeSaisineEnum;
  }): Promise<ListedNominationSessionsDto> {
    return this.listNominationSessionsQuery.handle(query);
  }

  defineNominationFileOutcome(command: {
    comment: string | null;
    nominationFileId: string;
    outcome: NominationFileOutcomeEnum | null;
    sessionId: string;
  }): Promise<void> {
    return this.defineNominationFilesOutcome({
      items: [{ comment: command.comment, nominationFileId: command.nominationFileId }],
      outcome: command.outcome,
      sessionId: command.sessionId,
    });
  }

  async defineNominationFilesOutcome(command: {
    items: readonly { nominationFileId: string; comment: string | null }[];
    outcome: NominationFileOutcomeEnum | null;
    sessionId: string;
  }): Promise<void> {
    const invalidations = await this.db.withTransaction(async () => {
      const session = await this.nominationSessionRepository.find(command.sessionId, {
        nominationFileIds: new Set(command.items.map(({ nominationFileId }) => nominationFileId)),
      });

      for (const { comment, nominationFileId } of command.items) {
        session.defineNominationFileOutcome({
          nominationFileId,
          outcome: isDefined(command.outcome)
            ? NominationFileOutcome.from({ comment, outcome: command.outcome })
            : null,
        });
      }

      return this.nominationSessionRepository.persist(session);
    });

    for (const invalidation of invalidations) {
      await this.events.emitAsync(
        DocInvalidatedIntegrationEvent.name,
        new DocInvalidatedIntegrationEvent(invalidation),
      );
    }
  }

  @Transactional()
  async writeNominationFileMemberMemo(command: {
    memo: string;
    nominationFileId: string;
    sessionId: string;
    userId: string;
  }) {
    const session = await this.nominationSessionRepository.find(command.sessionId);

    const { userId, nominationFileId, memo } = command;
    session.writeNominationFileMemberMemo({ memo, nominationFileId, userId });

    return this.nominationSessionRepository.persist(session);
  }

  getLolfiMagistratUrl(query: {
    nominationFileId: string;
    sessionId: string;
  }): Promise<LolfiMagistratUrlDto> {
    return this.getLolfiMagistratUrlQuery.handle(query);
  }

  listCurrentlyAffectedReporters(query: {
    role: RoleEnum;
    sessionId: string;
  }): Promise<ListedCurrentlyAffectedReportersDto> {
    return this.listCurrentlyAffectedReportersQuery.handle(query);
  }

  countUnaffectedFiles(query: {
    nominationFileIds: readonly string[] | undefined;
    sessionId: string;
  }): Promise<CountedUnaffectedFilesDto> {
    return this.countUnaffectedFilesQuery.handle(query);
  }

  listNominationFilesAsExcel(query: { sessionId: string }): Promise<StreamableFile> {
    return this.listNominationFilesAsExcelQuery.handle(query);
  }

  countSessionAuditions(query: { role: RoleEnum; sessionId: string }): Promise<CountedSessionAuditionsDto> {
    return this.countSessionAuditionsQuery.handle(query);
  }

  listSessionAuditions(query: {
    filters: {
      reporterIds: readonly (string | null)[];
      search: string | null;
    };
    pagination: Pagination;
    role: RoleEnum;
    sessionId: string;
    sortBy: 'auditionDate' | null;
    sortDesc: boolean;
  }): Promise<ListedSessionAuditionsDto> {
    return this.listSessionAuditionsQuery.handle(query);
  }

  listSessionAuditionsAsExcel(query: { role: RoleEnum; sessionId: string }): Promise<StreamableFile> {
    return this.listSessionAuditionsAsExcelQuery.handle(query);
  }

  listMissingEvaluationsAsExcel(query: { sessionId: string }): Promise<StreamableFile> {
    return this.listMissingEvaluationsAsExcelQuery.handle(query);
  }

  countNominationFilesByStatus(query: { sessionId: string }): Promise<NominationFilesStatusCountDto> {
    return this.countNominationFilesByStatusQuery.handle(query);
  }

  countUsersNewSessions(): Promise<CountUsersNewSessionsDto> {
    return this.countUsersNewSessionsQuery.handle();
  }

  @Transactional()
  async validateSession(command: { sessionId: string; userId: string }): Promise<void> {
    const session = await this.nominationSessionRepository.find(command.sessionId);
    session.validate({ userId: command.userId });
    await this.nominationSessionRepository.persist(session);
  }

  @Transactional()
  async hideAlert(command: { sessionId: string; nominationFileId: string }): Promise<void> {
    const session = await this.nominationSessionRepository.find(command.sessionId);
    session.hideAlert(command);
    await this.nominationSessionRepository.persist(session);
  }

  /** @internal */
  async internalIngestLolfiSessions(
    sessions: readonly { id: number; creationDate: DateOnly; name: string | null }[],
  ): Promise<void> {
    for (const session of sessions) {
      await this.db.withTransaction(Propagation.RequiresNew, async () => {
        const nominationSessions = await this.lolfiNominationSessionFinder.find(session).catch((error) => {
          Sentry.captureException(error);
          this.logger.error(`Errror while retrieving lolfi sessions ${session.id}`, error);

          return [] as SessionTransparence[];
        });

        for (const nominationSession of nominationSessions) {
          await this.nominationSessionRepository.persist(nominationSession).catch((error) => {
            this.logger.error(
              `Error while persisting session LOLFI ${session.id}, formation: ${nominationSession.formation}`,
              error,
            );
            Sentry.captureException(error);
          });
        }
      });
    }
  }

  /** @internal */
  internalFindSynchronisedLolfiSessions(query: {
    lolfiSessionIds: readonly number[];
  }): Promise<Map<number, Set<FormationEnum>>> {
    return this.synchronisedLolfiSessionsFinder.find(query.lolfiSessionIds);
  }

  /** @internal */
  async internalFindNominationFiles(query: {
    ids?: readonly string[] | undefined;
    sessionId: string;
  }): Promise<InternalFoundAgendaNominationFiles> {
    return Sentry.startSpan({ name: 'fr.csm.fondation:sessions:internalFindAgendaNominationFiles' }, () =>
      this.internalFindNominationFilesQuery.handle(query),
    );
  }

  /** @internal */
  internalGetSessionFormation(query: { sessionId: string }): Promise<FormationEnum> {
    return this.sessionsFinder.formation(query);
  }

  /** @internal */
  internalFindNominationFilesProgress(query: {
    affectationVersionId: string;
    nominationFileIds: readonly string[];
  }): Promise<Map<string, NominationFileProgress>> {
    return this.nominationFilesProgressFinder.find(query);
  }

  /** @internal */
  internalFindSessionNominationFileOutcomes(query: {
    sessionId: string;
  }): Promise<Map<string, NominationFileOutcomeEnum | null>> {
    return this.nominationFileOutcomesFinder.bySession(query);
  }

  /** @internal */
  internalCountAffectedReporters(query: {
    sessionId: string;
    versionId: string | undefined;
  }): Promise<number> {
    return this.sessionsFinder.affectedReportersCount(query);
  }

  /** @internal */
  internalFindNominationFileOutcomes(query: {
    nominationFileIds: ReadonlySet<string>;
  }): Promise<Map<string, NominationFileOutcomeEnum | null>> {
    return this.nominationFileOutcomesFinder.find(query);
  }

  /** @internal */
  internalFindSessions(query: {
    sessionIds: readonly string[];
  }): Promise<Map<string, FoundNominationSession>> {
    return this.sessionsFinder.find(query);
  }

  /** @internal */
  async internalGetSession(query: { sessionId: string }): Promise<FoundNominationSession> {
    const sessions = await this.sessionsFinder.find({ sessionIds: [query.sessionId] });
    const session = sessions.get(query.sessionId);
    if (!session) throw new NotFoundException();

    return session;
  }

  /** @internal */
  internalFindSessionState(query: { sessionId: string }): Promise<NominationSessionState> {
    return this.sessionsFinder.state(query);
  }

  /** @internal */
  internalListMagistratNominationFiles(query: {
    magistratId: string;
    pagination: Pagination;
    role: RoleEnum;
  }) {
    return this.internalListMagistratNominationFilesQuery.handle(query);
  }

  /** @internal */
  internalFindLastAffectationVersion(query: { sessionId: string }): Promise<OptionalAffectationVersion> {
    return this.versions.last(query);
  }

  /** @internal */
  internalFindLastPublishedAffectationVersion(query: {
    sessionId: string;
  }): Promise<OptionalAffectationVersion> {
    return this.versions.lastPublished(query);
  }

  /** @internal */
  internalFindPublishedReporters(query: {
    nominationFileIds: readonly string[];
  }): Promise<Map<string, { firstName: string; id: string; lastName: string }[]>> {
    return this.versions.findPublishedReporters(query);
  }

  /** @internal */
  internalFindNominationFilesByIds(query: {
    nominationFileIds: readonly string[];
  }): Promise<Map<string, FoundNominationFile>> {
    return this.hydratedNominationFiles.byIds(query);
  }

  /** @internal */
  /** most recent session first, then by file number */
  internalSortNominationFiles(query: { nominationFileIds: readonly string[] }): Promise<string[]> {
    return this.hydratedNominationFiles.sort(query);
  }

  /** @internal */
  internalHydrateNominationFiles(query: {
    nominationFileIds: readonly string[];
    role: RoleEnum;
  }): Promise<HydratedNominationFile[]> {
    return this.hydratedNominationFiles.hydrate(query);
  }

  @Transactional()
  async archiveSession(command: { sessionId: string; userId: string }): Promise<void> {
    const session = await this.nominationSessionRepository.find(command.sessionId);
    const unreportedFileCount = await this.reportedSessionsFinder.unreportedFilesCount({
      sessionId: command.sessionId,
    });

    session.archive({ unreportedFileCount, userId: command.userId });
    await this.nominationSessionRepository.persist(session);
  }

  @Transactional()
  async deleteSession(command: { id: string; userId: string }): Promise<void> {
    const sessionId = command.id;
    const session = await this.nominationSessionRepository.find(sessionId);

    const attachmentsCount = await this.sessionsFinder.attachmentsCount({ sessionId });

    const version = await this.versions.last({ sessionId });
    const affectedReportersCount = await this.sessionsFinder.affectedReportersCount({
      sessionId,
      versionId: version.optionalId,
    });

    session.delete({
      affectedReportersCount,
      attachmentsCount,
      userId: command.userId,
    });

    await this.nominationSessionRepository.persist(session);
  }
}
