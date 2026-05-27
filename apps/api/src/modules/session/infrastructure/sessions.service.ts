import { forwardRef, Inject, Injectable, Logger, StreamableFile } from '@nestjs/common';
import * as Sentry from '@sentry/node';

import { Magistrat, PrioriteEnum, NominationFile as Reports, Role, TypeDeSaisine } from 'shared-models';

import { LodamNominationFile } from '../domain/nomination-file';
import { NominationFileOutcome, NominationFileOutcomeEnum } from '../domain/nomination-file-outcome';
import { NominationSession } from '../domain/nomination-session';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';
import { Pagination } from 'src/modules/framework/pagination';
import { Sortable } from 'src/modules/framework/sorting';
import { MembersService } from 'src/modules/members';
import { DetailsMemberSessionQueryDto } from 'src/modules/members/infrastructure/dtos/members.dto';
import { DateOnly } from 'src/utils/date-only';
import { isDefined } from 'src/utils/is-defined';

import { ListNominationFilesQueryDto } from './dtos/nomination-file.dto';
import { ListGdsNominationSessionsQueryDto } from './dtos/nomination-session.dto';
import { AffectationVersionFinder, FoundAffectationVersion } from './finders/affectation-version.finder';
import { AutoAffectationsFinder } from './finders/auto-affectations.finder';
import { UnreportedSessionFilesCountFinder } from './finders/count-unreported-files.finder';
import { LolfiNominationSessionFinder } from './finders/lolfi-nomination-session.finder';
import { NominationSessionFileFinder } from './finders/nomination-session-file.finder';
import { NominationSessionFinder } from './finders/nomination-session.finder';
import {
  CountNominationFilesByStatusQuery,
  NominationFilesStatusCountDto,
} from './queries/count-nomination-files-by-status.query';
import { CountedUnaffectedFilesDto, CountUnaffectedFilesQuery } from './queries/count-unaffected-files.query';
import {
  CountUsersNewSessionsDto,
  CountUsersNewSessionsQuery,
} from './queries/count-users-new-sessions.query';
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
import {
  InternalListMemberSessionsQuery,
  type ListedMemberSessionsDto,
} from './queries/internal-list-member-sessions.query';
import {
  ListCurrentlyAffectedReportersQuery,
  ListedCurrentlyAffectedReportersDto,
} from './queries/list-currently-affected-reporters.query';
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
import { NominationSessionRepository } from './repositories/nomination-session.repository';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  constructor(
    @Inject(forwardRef(() => MembersService))
    private readonly members: MembersService,
    private readonly autoAffectationsFinder: AutoAffectationsFinder,
    private readonly detailNominationSessionAffectationVersionQuery: DetailNominationSessionAffectationVersionQuery,
    private readonly detailNominationSessionAttachmentQuery: DetailNominationSessionAttachmentQuery,
    private readonly detailNominationSessionQuery: DetailNominationSessionQuery,
    private readonly getLolfiMagistratUrlQuery: GetLolfiMagistratUrlQuery,
    private readonly internalDetailMemberSessionQuery: InternalDetailMemberSessionQuery,
    private readonly internalListMemberSessionsQuery: InternalListMemberSessionsQuery,
    private readonly internalFindNominationFilesQuery: InternalFindDocsNominationFilesQuery,
    private readonly listNominationFilesQuery: ListNominationFilesQuery,
    private readonly listNominationSessionAttachmentsQuery: ListNominationSessionAttachmentsQuery,
    private readonly listNominationSessionsQuery: ListNominationSessionsQuery,
    private readonly nominationSessionFileFinder: NominationSessionFileFinder,
    private readonly nominationSessionRepository: NominationSessionRepository,
    private readonly listCurrentlyAffectedReportersQuery: ListCurrentlyAffectedReportersQuery,
    private readonly countUnaffectedFilesQuery: CountUnaffectedFilesQuery,
    private readonly countNominationFilesByStatusQuery: CountNominationFilesByStatusQuery,
    private readonly countUsersNewSessionsQuery: CountUsersNewSessionsQuery,
    private readonly listNominationFilesAsExcelQuery: ListNominationFilesAsExcelQuery,
    private readonly lolfiNominationSessionFinder: LolfiNominationSessionFinder,
    private readonly prisma: PrismaService,
    private readonly versions: AffectationVersionFinder,
    private readonly sessionsFinder: NominationSessionFinder,
    private readonly unreportedSessionFilesCountFinder: UnreportedSessionFilesCountFinder,
  ) {}

  /** @internal */
  listMemberSessions(query: {
    user: { id: string; role: Role };
    typeDeSaisine: TypeDeSaisine;
  }): Promise<ListedMemberSessionsDto> {
    return this.internalListMemberSessionsQuery.handle(query);
  }

  /** @internal */
  detailMemberSession(query: {
    user: { id: string; role: Role };
    pagination: Pagination;
    sessionId: string;
    typeDeSaisine: TypeDeSaisine;
    status: Reports.ReportState[] | undefined;
    sorting: Sortable<DetailsMemberSessionQueryDto>;
    priorities: (PrioriteEnum | null)[] | undefined;
  }): Promise<DetailedMemberSessionDto> {
    return this.internalDetailMemberSessionQuery.handle(query);
  }

  async affectReportersAndPriorities(command: {
    sessionId: string;
    affectations: readonly {
      nominationFileId: string;
      priorities: PrioriteEnum[];
      reporterIds: readonly string[];
    }[];
  }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const session = await this.nominationSessionRepository.find(command.sessionId, {
        tx,
        nominationFileIds: new Set(command.affectations.map(({ nominationFileId }) => nominationFileId)),
      });

      const memberIds = Array.from(
        new Set(command.affectations.flatMap((affectation) => affectation.reporterIds)),
      );

      const formationMemberIds = await this.members
        .findMembers({
          tx,
          ids: memberIds,
          formation: session.formation,
        })
        .then((ids) => new Set(ids));

      session.affectNominationFileReporters({ ...command, formationMemberIds });

      for (const item of command.affectations) {
        session.setNominationFilePriority({
          nominationFileId: item.nominationFileId,
          priorities: item.priorities,
        });
      }

      await this.nominationSessionRepository.persist(session, tx);
    });
  }

  async listNominationFiles(query: {
    pagination: Pagination;
    sorting: Sortable<ListNominationFilesQueryDto>;
    sessionId: string;
    user: { role: Role; id: string };
    filters: {
      reporterIds: readonly (string | null)[];
      priorities: readonly (PrioriteEnum | null)[];
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
    const session = await this.nominationSessionRepository.find(command.sessionId);
    session.publishAffectationVersion({ userId: command.userId });
    await this.nominationSessionRepository.persist(session);
  }

  async autoAffectation(command: {
    sessionId: string;
    nominationFileIds: readonly string[] | undefined;
    excludedMemberIds: readonly string[] | undefined;
  }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const session = await this.nominationSessionRepository.find(command.sessionId, {
        tx,
        nominationFileIds: new Set(command.nominationFileIds),
      });

      const autoAffectations = await this.autoAffectationsFinder.find({
        tx,
        sessionId: command.sessionId,
        nominationFileIds: command.nominationFileIds,
        excludedMemberIds: command.excludedMemberIds,
      });

      const formationMemberIds = await this.members
        .findMembers({ tx, formation: session.formation, ids: undefined })
        .then((ids) => new Set(ids));

      session.autoAffectNominationFileReporters({ autoAffectations, formationMemberIds });
      await this.nominationSessionRepository.persist(session, tx);
    });
  }

  async updateNominationFileComment(command: {
    sessionId: string;
    nominationFileId: string;
    comment: string | null;
  }): Promise<void> {
    await this.prisma.dossierDeNomination.update({
      where: {
        id: command.nominationFileId,
        sessionId: command.sessionId,
      },
      data: { comment: command.comment },
    });
  }

  async createNominationSessionFromLodam(command: {
    files: readonly LodamNominationFile[];
    name: string;
    date: DateOnly;
    observationClosingDate: DateOnly;
    dueDate: DateOnly | null;
    positionStartDate: DateOnly | null;
    formation: Magistrat.Formation;
    userId: string;
  }): Promise<{ id: string }> {
    const fullNames = command.files.flatMap(({ reporters }) => reporters);
    const members = await this.members.findMembersByFullName({
      fullNames,
      formation: command.formation,
    });

    const session = NominationSession.createLodamNominationTreeAndAffectMembers({
      ...command,
      formationMembers: members,
      typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
    });
    await this.nominationSessionRepository.persist(session);

    return { id: session.id };
  }

  async updateSessionNominationFileObservers(command: {
    sessionId: string;
    files: readonly LodamNominationFile[];
  }): Promise<void> {
    const [existingNominationFiles, session] = await this.prisma.$transaction(async (tx) => {
      const txExistingNominationFiles = await this.nominationSessionFileFinder.bySessionAndFileNumber({
        tx,
        sessionId: command.sessionId,
        fileNumbers: command.files.map(({ fileNumber }) => fileNumber),
      });

      const txSession = await this.nominationSessionRepository.find(command.sessionId, {
        tx,
        nominationFileIds: new Set(txExistingNominationFiles.map(({ id }) => id)),
      });

      return [txExistingNominationFiles, txSession];
    });

    session.updateNominationFileObservers({
      existingNominationFiles,
      nominationFiles: command.files,
    });
    await this.nominationSessionRepository.persist(session);
  }

  async addNominationSessionAttachments(command: {
    sessionId: string;
    files: { id: string }[];
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(command.sessionId);

    session.addAttachments({ files: command.files });
    await this.nominationSessionRepository.persist(session);
  }

  async removeNominationSessionAttachment(command: { sessionId: string; fileId: string }): Promise<void> {
    const session = await this.nominationSessionRepository.find(command.sessionId);

    session.removeAttachment({ fileId: command.fileId });
    await this.nominationSessionRepository.persist(session);
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

  details(query: {
    sessionId: string;
    tx?: Prisma.TransactionClient;
  }): Promise<DetailedNominationSessionDto> {
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
    const session = await this.nominationSessionRepository.find(command.sessionId);
    session.update(command.data);
    await this.nominationSessionRepository.persist(session);
  }

  listNominationSessions(query: {
    search: string | null;
    pagination: Pagination;
    typeDeSaisine: TypeDeSaisine;
    formations: readonly Magistrat.Formation[] | undefined;
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

    await this.nominationSessionRepository.persist(session);
  }

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

  async validateSession(command: { sessionId: string; userId: string }): Promise<void> {
    const session = await this.nominationSessionRepository.find(command.sessionId);
    session.validate({ userId: command.userId });
    await this.nominationSessionRepository.persist(session);
  }

  async hideAlert(command: { sessionId: string; nominationFileId: string }): Promise<void> {
    const session = await this.nominationSessionRepository.find(command.sessionId);
    session.hideAlert(command);
    await this.nominationSessionRepository.persist(session);
  }

  async internalIngestLolfiSessions(
    sessions: readonly {
      id: number;
      creationDate: DateOnly;
      name: string | null;
    }[],
  ): Promise<void> {
    for (const session of sessions) {
      const nominationSessions = await this.lolfiNominationSessionFinder.find(session).catch((error) => {
        Sentry.captureException(error);
        this.logger.error(`Errror while retrieving lolfi sessions ${session.id}`, error);

        return [] as NominationSession[];
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
    }
  }

  async internalFindNominationFiles(query: {
    sessionId: string;
    ids?: readonly string[] | undefined;
    // TODO: use nest-cls
    tx?: Prisma.TransactionClient;
  }): Promise<InternalFoundAgendaNominationFiles> {
    return Sentry.startSpan({ name: 'fr.csm.fondation:sessions:internalFindAgendaNominationFiles' }, () =>
      this.internalFindNominationFilesQuery.handle(query),
    );
  }

  async archiveSession(command: { sessionId: string; userId: string }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const session = await this.nominationSessionRepository.find(command.sessionId, { tx });
      const unreportedFileCount = await this.unreportedSessionFilesCountFinder.find({
        tx,
        sessionId: command.sessionId,
      });

      session.archive({ userId: command.userId, unreportedFileCount });
      await this.nominationSessionRepository.persist(session, tx);
    });
  }

  async deleteSession(command: { id: string; userId: string }): Promise<void> {
    const { session, affectedReportersCount, attachmentsCount } = await this.prisma.$transaction(
      async (tx) => {
        const sessionId = command.id;
        const session = await this.nominationSessionRepository.find(sessionId, {
          tx,
        });

        const attachmentsCount = await this.sessionsFinder.attachmentsCount({
          tx,
          sessionId,
        });

        const version = await this.versions.last({ sessionId, tx });
        const affectedReportersCount = await this.sessionsFinder.affectedReportersCount({
          tx,
          sessionId,
          versionId: version.optionalId,
        });

        return { session, affectedReportersCount, attachmentsCount };
      },
    );

    session.delete({
      attachmentsCount,
      affectedReportersCount,
      userId: command.userId,
    });

    await this.nominationSessionRepository.persist(session);
  }
}
