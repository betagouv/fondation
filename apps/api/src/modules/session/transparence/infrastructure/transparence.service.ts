import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { forwardRef, Inject, Injectable, Logger, StreamableFile } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as Sentry from '@sentry/node';

import { NominationFileOutcome, NominationFileOutcomeEnum } from '../../shared/types/nomination-file-outcome';
import { SessionTransparence } from '../domain/session-transparence';
import { LodamTransparenceFile } from '../domain/transparence-file';
import { OfficialReportsInvalidatedIntegrationEvent } from 'src/modules/docs/shared/domain/invalidation/official-report-invalidated.integration-event';
import { Db } from 'src/modules/framework/database';
import { Pagination } from 'src/modules/framework/pagination';
import { Sortable } from 'src/modules/framework/sorting';
import { MembersService } from 'src/modules/members';
import { DetailsMemberSessionQueryDto } from 'src/modules/members/infrastructure/dtos/members.dto';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { PriorityEnum } from 'src/modules/shared/priority.enum';
import { ReportStateEnum } from 'src/modules/shared/report-state.enum';
import type { RoleEnum } from 'src/modules/shared/role.enum';
import { TypeDeSaisineEnum } from 'src/modules/shared/type-de-saisine.enum';
import { DateOnly } from 'src/utils/date-only';
import { isDefined } from 'src/utils/is-defined';
import { TimeOnly } from 'src/utils/time-only';

import { ListNominationFilesQueryDto } from './dtos/nomination-file.dto';
import { ListGdsNominationSessionsQueryDto } from './dtos/transparence-session.dto';
import { AffectationVersionFinder, FoundAffectationVersion } from './finders/affectation-version.finder';
import { AutoAffectationsFinder } from './finders/auto-affectations.finder';
import {
  type HydratedNominationFile,
  HydratedNominationFilesFinder,
} from './finders/hydrated-nomination-files.finder';
import { LolfiNominationSessionFinder } from './finders/lolfi-nomination-session.finder';
import { TransparenceFilesFinder } from './finders/transparence-files.finder';
import { NominationSessionFinder } from './finders/transparence-session.finder';
import { UnreportedSessionFilesCountFinder } from './finders/unreported-transparence-files-count.finder';
import {
  CountNominationFilesByStatusQuery,
  NominationFilesStatusCountDto,
} from './queries/count-nomination-files-by-status.query';
import { CountedUnaffectedFilesDto, CountUnaffectedFilesQuery } from './queries/count-unaffected-files.query';
import {
  CountUsersNewSessionsDto,
  CountUsersNewSessionsQuery,
} from './queries/count-users-new-sessions.query';
import {
  type DetailedNominationFileAttachmentDto,
  DetailNominationFileAttachmentQuery,
} from './queries/detail-nomination-file-attachment.query';
import { DetailNominationSessionAffectationVersionQuery } from './queries/detail-nomination-session-affectation-version.query';
import {
  type DetailedNominationSessionAttachmentDto,
  DetailNominationSessionAttachmentQuery,
} from './queries/detail-nomination-session-attachment.query';
import {
  type DetailedNominationSessionDto,
  DetailNominationSessionQuery,
} from './queries/detail-nomination-session.query';
import { GetLolfiMagistratUrlQuery, LolfiMagistratUrlDto } from './queries/get-lolfi-magistrat-url.query';
import {
  type DetailedMemberSessionDto,
  InternalDetailMemberSessionQuery,
} from './queries/internal-detail-member-session.query';
import {
  InternalFindDocsNominationFilesQuery,
  InternalFoundAgendaNominationFiles,
} from './queries/internal-find-docs-nomination-files.query';
import { InternalListMagistratNominationFilesQuery } from './queries/internal-list-magistrat-nomination-files.query';
import {
  InternalListMemberSessionsQuery,
  type ListedMemberSessionsDto,
} from './queries/internal-list-member-sessions.query';
import {
  ListCurrentlyAffectedReportersQuery,
  ListedCurrentlyAffectedReportersDto,
} from './queries/list-currently-affected-reporters.query';
import {
  type ListedNominationFileAttachmentDto,
  ListNominationFileAttachmentsQuery,
} from './queries/list-nomination-file-attachments.query';
import { ListNominationFilesAsExcelQuery } from './queries/list-nomination-files-as-excel.query';
import {
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
import { SessionTransparenceRepository } from './repositories/session-transparence.repository';

@Injectable()
export class TransparenceService {
  private readonly logger = new Logger(TransparenceService.name);
  constructor(
    @Inject(forwardRef(() => MembersService))
    private readonly members: MembersService,
    private readonly autoAffectationsFinder: AutoAffectationsFinder,
    private readonly detailNominationFileAttachmentQuery: DetailNominationFileAttachmentQuery,
    private readonly detailNominationSessionAffectationVersionQuery: DetailNominationSessionAffectationVersionQuery,
    private readonly detailNominationSessionAttachmentQuery: DetailNominationSessionAttachmentQuery,
    private readonly detailNominationSessionQuery: DetailNominationSessionQuery,
    private readonly getLolfiMagistratUrlQuery: GetLolfiMagistratUrlQuery,
    private readonly internalDetailMemberSessionQuery: InternalDetailMemberSessionQuery,
    private readonly hydratedNominationFiles: HydratedNominationFilesFinder,
    private readonly internalListMagistratNominationFilesQuery: InternalListMagistratNominationFilesQuery,
    private readonly internalListMemberSessionsQuery: InternalListMemberSessionsQuery,
    private readonly internalFindNominationFilesQuery: InternalFindDocsNominationFilesQuery,
    private readonly listNominationFileAttachmentsQuery: ListNominationFileAttachmentsQuery,
    private readonly listNominationFilesQuery: ListNominationFilesQuery,
    private readonly listNominationSessionAttachmentsQuery: ListNominationSessionAttachmentsQuery,
    private readonly listNominationSessionsQuery: ListNominationSessionsQuery,
    private readonly nominationSessionFileFinder: TransparenceFilesFinder,
    private readonly nominationSessionRepository: SessionTransparenceRepository,
    private readonly listCurrentlyAffectedReportersQuery: ListCurrentlyAffectedReportersQuery,
    private readonly countUnaffectedFilesQuery: CountUnaffectedFilesQuery,
    private readonly countNominationFilesByStatusQuery: CountNominationFilesByStatusQuery,
    private readonly countUsersNewSessionsQuery: CountUsersNewSessionsQuery,
    private readonly listNominationFilesAsExcelQuery: ListNominationFilesAsExcelQuery,
    private readonly lolfiNominationSessionFinder: LolfiNominationSessionFinder,
    private readonly db: Db,
    private readonly versions: AffectationVersionFinder,
    private readonly sessionsFinder: NominationSessionFinder,
    private readonly unreportedSessionFilesCountFinder: UnreportedSessionFilesCountFinder,

    private readonly events: EventEmitter2,
  ) {}

  /** @internal */
  listMemberSessions(query: {
    user: { id: string; role: RoleEnum };
    typeDeSaisine: TypeDeSaisineEnum;
  }): Promise<ListedMemberSessionsDto> {
    return this.internalListMemberSessionsQuery.handle(query);
  }

  /** @internal */
  detailMemberSession(query: {
    user: { id: string; role: RoleEnum };
    pagination: Pagination;
    sessionId: string;
    typeDeSaisine: TypeDeSaisineEnum;
    status: ReportStateEnum[] | undefined;
    sorting: Sortable<DetailsMemberSessionQueryDto>;
    priorities: (PriorityEnum | null)[] | undefined;
  }): Promise<DetailedMemberSessionDto> {
    return this.internalDetailMemberSessionQuery.handle(query);
  }

  @Transactional()
  async affectReportersAndPriorities(command: {
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
      .findMembers({ ids: memberIds, formation: session.formation })
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
    sorting: Sortable<ListNominationFilesQueryDto>;
    sessionId: string;
    user: { role: RoleEnum; id: string };
    filters: {
      reporterIds: readonly (string | null)[];
      priorities: readonly (PriorityEnum | null)[];
      outcomes: readonly (NominationFileOutcomeEnum | null)[];
      search: string | null;
    };
  }): Promise<PaginatedNominationFiles> {
    return this.listNominationFilesQuery.handle(query);
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
        OfficialReportsInvalidatedIntegrationEvent.name,
        new OfficialReportsInvalidatedIntegrationEvent(invalidation),
      );
    }
  }

  @Transactional()
  async autoAffectation(command: {
    sessionId: string;
    nominationFileIds: readonly string[] | undefined;
    excludedMemberIds: readonly string[] | undefined;
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(command.sessionId, {
      nominationFileIds: new Set(command.nominationFileIds),
    });

    const autoAffectations = await this.autoAffectationsFinder.find({
      sessionId: command.sessionId,
      nominationFileIds: command.nominationFileIds,
      excludedMemberIds: command.excludedMemberIds,
    });

    const formationMemberIds = await this.members
      .findMembers({ formation: session.formation, ids: undefined })
      .then((ids) => new Set(ids));

    session.autoAffectNominationFileReporters({
      autoAffectations,
      formationMemberIds,
    });
    await this.nominationSessionRepository.persist(session);
  }

  async updateNominationFileComment(command: {
    sessionId: string;
    nominationFileId: string;
    comment: string | null;
  }): Promise<void> {
    await this.db.tx.dossierDeNomination.update({
      where: {
        id: command.nominationFileId,
        sessionId: command.sessionId,
      },
      data: { comment: command.comment },
    });
  }

  @Transactional()
  async updateNominationFileAuditionDate(command: {
    sessionId: string;
    nominationFileId: string;
    auditionDateTime: { date: DateOnly; time: TimeOnly } | null;
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(command.sessionId, {
      nominationFileIds: new Set([command.nominationFileId]),
    });

    if (!isDefined(command.auditionDateTime)) {
      session.unscheduleAudition({ nominationFileId: command.nominationFileId });
    } else {
      session.scheduleAudition({
        nominationFileId: command.nominationFileId,
        auditionDateTime: command.auditionDateTime,
      });
    }

    await this.nominationSessionRepository.persist(session);
  }

  @Transactional()
  async createNominationSessionFromLodam(command: {
    files: readonly LodamTransparenceFile[];
    name: string;
    date: DateOnly;
    observationClosingDate: DateOnly;
    dueDate: DateOnly | null;
    positionStartDate: DateOnly | null;
    formation: FormationEnum;
    userId: string;
  }): Promise<{ id: string }> {
    const fullNames = command.files.flatMap(({ reporters }) => reporters);
    const members = await this.members.findMembersByFullName({
      fullNames,
      formation: command.formation,
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
    sessionId: string;
    files: readonly LodamTransparenceFile[];
  }): Promise<void> {
    const existingNominationFiles = await this.nominationSessionFileFinder.bySessionAndFileNumber({
      sessionId: command.sessionId,
      fileNumbers: command.files.map(({ fileNumber }) => fileNumber),
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
    sessionId: string;
    files: { id: string }[];
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
    sessionId: string;
    nominationFileId: string;
    files: { id: string }[];
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(command.sessionId);

    session.addNominationFileAttachments({
      nominationFileId: command.nominationFileId,
      files: command.files,
    });
    await this.nominationSessionRepository.persist(session);
  }

  @Transactional()
  async removeNominationFileAttachment(command: {
    sessionId: string;
    nominationFileId: string;
    fileId: string;
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(command.sessionId);

    session.removeNominationFileAttachment({
      nominationFileId: command.nominationFileId,
      fileId: command.fileId,
    });
    await this.nominationSessionRepository.persist(session);
  }

  listNominationFileAttachments(query: {
    sessionId: string;
    nominationFileId: string;
  }): Promise<ListedNominationFileAttachmentDto> {
    return this.listNominationFileAttachmentsQuery.handle(query);
  }

  detailNominationFileAttachment(query: {
    sessionId: string;
    nominationFileId: string;
    fileId: string;
  }): Promise<DetailedNominationFileAttachmentDto> {
    return this.detailNominationFileAttachmentQuery.handle(query);
  }

  listAttachments(query: { sessionId: string }): Promise<ListedNominationSessionAttachmentDto> {
    return this.listNominationSessionAttachmentsQuery.handle(query);
  }

  detailAttachment(query: {
    sessionId: string;
    fileId: string;
  }): Promise<DetailedNominationSessionAttachmentDto> {
    return this.detailNominationSessionAttachmentQuery.handle(query);
  }

  details(query: { sessionId: string }): Promise<DetailedNominationSessionDto> {
    return this.detailNominationSessionQuery.handle(query);
  }

  async update(command: {
    sessionId: string;
    data: {
      name: string;
      date: DateOnly;
      observationsClosingDate: DateOnly;
      dueDate: DateOnly | null;
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
        OfficialReportsInvalidatedIntegrationEvent.name,
        new OfficialReportsInvalidatedIntegrationEvent(invalidation),
      );
    }
  }

  listNominationSessions(query: {
    search: string | null;
    pagination: Pagination;
    typeDeSaisine: TypeDeSaisineEnum;
    formations: readonly FormationEnum[] | undefined;
    sorting: Sortable<ListGdsNominationSessionsQueryDto>;
  }): Promise<ListedNominationSessionsDto> {
    return this.listNominationSessionsQuery.handle(query);
  }

  async defineNominationFileOutcome(command: {
    sessionId: string;
    nominationFileId: string;
    outcome: NominationFileOutcomeEnum | null;
    comment: string | null;
  }): Promise<void> {
    const invalidations = await this.db.withTransaction(async () => {
      const session = await this.nominationSessionRepository.find(command.sessionId, {
        nominationFileIds: new Set([command.nominationFileId]),
      });

      const outcome = isDefined(command.outcome)
        ? NominationFileOutcome.from({
            outcome: command.outcome,
            comment: command.comment,
          })
        : null;

      session.defineNominationFileOutcome({
        outcome,
        nominationFileId: command.nominationFileId,
      });

      return this.nominationSessionRepository.persist(session);
    });

    for (const invalidation of invalidations) {
      await this.events.emitAsync(
        OfficialReportsInvalidatedIntegrationEvent.name,
        new OfficialReportsInvalidatedIntegrationEvent(invalidation),
      );
    }
  }

  @Transactional()
  async writeNominationFileMemberMemo(command: {
    userId: string;
    sessionId: string;
    nominationFileId: string;
    memo: string;
  }) {
    const session = await this.nominationSessionRepository.find(command.sessionId);

    const { userId, nominationFileId, memo } = command;
    session.writeNominationFileMemberMemo({ userId, nominationFileId, memo });

    return this.nominationSessionRepository.persist(session);
  }

  getLolfiMagistratUrl(query: {
    sessionId: string;
    nominationFileId: string;
  }): Promise<LolfiMagistratUrlDto> {
    return this.getLolfiMagistratUrlQuery.handle(query);
  }

  listCurrentlyAffectedReporters(query: { sessionId: string }): Promise<ListedCurrentlyAffectedReportersDto> {
    return this.listCurrentlyAffectedReportersQuery.handle(query);
  }

  countUnaffectedFiles(query: {
    sessionId: string;
    nominationFileIds: readonly string[] | undefined;
  }): Promise<CountedUnaffectedFilesDto> {
    return this.countUnaffectedFilesQuery.handle(query);
  }

  listNominationFilesAsExcel(query: { sessionId: string }): Promise<StreamableFile> {
    return this.listNominationFilesAsExcelQuery.handle(query);
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

  async internalFindNominationFiles(query: {
    sessionId: string;
    ids?: readonly string[] | undefined;
  }): Promise<InternalFoundAgendaNominationFiles> {
    return Sentry.startSpan({ name: 'fr.csm.fondation:sessions:internalFindAgendaNominationFiles' }, () =>
      this.internalFindNominationFilesQuery.handle(query),
    );
  }

  internalGetSessionFormation(query: { sessionId: string }): Promise<FormationEnum> {
    return this.sessionsFinder.formation(query);
  }

  /** @internal */
  internalListMagistratNominationFiles(query: { magistratId: string; pagination: Pagination }) {
    return this.internalListMagistratNominationFilesQuery.handle(query);
  }

  /** @internal */
  internalHydrateNominationFiles(query: {
    nominationFileIds: readonly string[];
  }): Promise<HydratedNominationFile[]> {
    return this.hydratedNominationFiles.hydrate(query);
  }

  @Transactional()
  async archiveSession(command: { sessionId: string; userId: string }): Promise<void> {
    const session = await this.nominationSessionRepository.find(command.sessionId);
    const unreportedFileCount = await this.unreportedSessionFilesCountFinder.find({
      sessionId: command.sessionId,
    });

    session.archive({ userId: command.userId, unreportedFileCount });
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
      attachmentsCount,
      affectedReportersCount,
      userId: command.userId,
    });

    await this.nominationSessionRepository.persist(session);
  }
}
