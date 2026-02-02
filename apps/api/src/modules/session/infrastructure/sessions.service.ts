import { Injectable, StreamableFile } from '@nestjs/common';
import { inspect } from 'node:util';

import { Magistrat, PrioriteEnum, Role, TypeDeSaisine } from 'shared-models';
import { PrismaService } from 'src/modules/framework/database';

import { Pagination } from 'src/modules/framework/pagination';
import { Sortable } from 'src/modules/framework/sorting';
import { MembersService } from 'src/modules/members';
import { DateOnly } from 'src/utils/date-only';
import { isDefined } from 'src/utils/is-defined';
import { NominationFile } from '../domain/nomination-file';
import {
  NominationFileOutcome,
  NominationFileOutcomeEnum,
} from '../domain/nomination-file-outcome';
import { NominationSession } from '../domain/nomination-session';
import { ListNominationFilesQueryDto } from './dtos/nomination-file.dto';
import { type FoundAffectationVersion } from './finders/affectation-version.finder';
import { AutoAffectationsFinder } from './finders/auto-affectations.finder';
import { NominationSessionFileFinder } from './finders/nomination-session-file.finder';
import {
  CountedUnaffectedFilesDto,
  CountUnaffectedFilesQuery,
} from './queries/count-unaffected-files.query';
import {
  CountNominationFilesByStatusQuery,
  NominationFilesStatusCountDto,
} from './queries/count-nomination-files-by-status.query';
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
  GetLolfiMagistratUrlQuery,
  LolfiMagistratUrlDto,
} from './queries/get-lolfi-magistrat-url.query';
import { GetNominationFileWithCommentQuery } from './queries/get-nomination-file-with-comment.query';
import {
  type DetailedMemberSessionDto,
  InternalDetailMemberSessionQuery,
} from './queries/internal-detail-member-session.query';
import {
  InternalListMemberSessionsQuery,
  type ListedMemberSessionsDto,
} from './queries/internal-list-member-sessions.query';
import {
  ListCurrentlyAffectedReportersQuery,
  ListedCurrentlyAffectedReportersDto,
} from './queries/list-currently-affected-reporters.query';
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
import { ListNominationFilesAsExcelQuery } from './queries/list-nomination-files-as-excel.query';

@Injectable()
export class SessionService {
  constructor(
    private readonly members: MembersService,
    private readonly autoAffectationsFinder: AutoAffectationsFinder,
    private readonly detailNominationSessionAffectationVersionQuery: DetailNominationSessionAffectationVersionQuery,
    private readonly detailNominationSessionAttachmentQuery: DetailNominationSessionAttachmentQuery,
    private readonly detailNominationSessionQuery: DetailNominationSessionQuery,
    private readonly getLolfiMagistratUrlQuery: GetLolfiMagistratUrlQuery,
    private readonly getNominationFileWithCommentQuery: GetNominationFileWithCommentQuery,
    private readonly internalDetailMemberSessionQuery: InternalDetailMemberSessionQuery,
    private readonly internalListMemberSessionsQuery: InternalListMemberSessionsQuery,
    private readonly listNominationFilesQuery: ListNominationFilesQuery,
    private readonly listNominationSessionAttachmentsQuery: ListNominationSessionAttachmentsQuery,
    private readonly listNominationSessionsQuery: ListNominationSessionsQuery,
    private readonly nominationSessionFileFinder: NominationSessionFileFinder,
    private readonly nominationSessionRepository: NominationSessionRepository,
    private readonly listCurrentlyAffectedReportersQuery: ListCurrentlyAffectedReportersQuery,
    private readonly countUnaffectedFilesQuery: CountUnaffectedFilesQuery,
    private readonly countNominationFilesByStatusQuery: CountNominationFilesByStatusQuery,
    private readonly listNominationFilesAsExcelQuery: ListNominationFilesAsExcelQuery,
    private readonly prisma: PrismaService,
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
    sessionId: string;
    typeDeSaisine: TypeDeSaisine;
  }): Promise<DetailedMemberSessionDto> {
    return this.internalDetailMemberSessionQuery.handle(query);
  }

  async affectReportersAndPriorities(command: {
    sessionId: string;
    affectations: readonly {
      nominationFileId: string;
      priority: PrioriteEnum | null;
      reporterIds: readonly string[];
    }[];
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(
      command.sessionId,
      {
        memberIds: Array.from(
          new Set(
            command.affectations.flatMap(
              (affectation) => affectation.reporterIds,
            ),
          ),
        ),
      },
    );

    session.affectNominationFileReporters(command.affectations);

    for (const item of command.affectations) {
      session.setNominationFilePriority({
        nominationFileId: item.nominationFileId,
        priority: item.priority,
      });
    }

    await this.nominationSessionRepository.persist(session);
  }

  async listNominationFiles(query: {
    pagination: Pagination;
    sorting: Sortable<ListNominationFilesQueryDto>;
    sessionId: string;
    user: { role: Role; id: string };
    filters: {
      reporterIds: readonly (string | null)[];
      priorities: readonly (PrioriteEnum | null)[];
    };
  }): Promise<PaginatedNominationFiles> {
    return this.listNominationFilesQuery.handle(query);
  }

  detailNominationSessionAffectationsVersion(query: {
    sessionId: string;
  }): Promise<FoundAffectationVersion> {
    return this.detailNominationSessionAffectationVersionQuery.handle(query);
  }

  async publishNominationSessionAffectationsVersion(command: {
    sessionId: string;
    userId: string;
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(
      command.sessionId,
    );
    session.publishAffectationVersion({ userId: command.userId });
    await this.nominationSessionRepository.persist(session);
  }

  async autoAffectation(command: {
    sessionId: string;
    nominationFileIds: readonly string[] | undefined;
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(
      command.sessionId,
    );
    const autoAffectations = await this.autoAffectationsFinder.find({
      sessionId: command.sessionId,
      nominationFileIds: command.nominationFileIds,
    });

    session.autoAffectNominationFileReporters(autoAffectations);

    await this.nominationSessionRepository.persist(session);
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

  getCommentAccess(query: {
    sessionId: string;
    nominationFileId: string;
  }): Promise<{ comment: string | null; userIds: string[] }> {
    return this.getNominationFileWithCommentQuery.handle(query);
  }

  async updateCommentAccess(command: {
    sessionId: string;
    nominationFileId: string;
    userIds: readonly string[];
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(
      command.sessionId,
    );

    session.grantCommentAccess({
      nominationFileId: command.nominationFileId,
      userIds: command.userIds,
    });

    await this.nominationSessionRepository.persist(session);
  }

  async createNominationSessionFromLodam(command: {
    files: readonly NominationFile[];
    name: string;
    date: DateOnly;
    observationClosingDate: DateOnly;
    dueDate: DateOnly | null;
    positionStartDate: DateOnly | null;
    formation: Magistrat.Formation;
  }): Promise<{ id: string }> {
    const fullNames = command.files.flatMap(({ reporters }) => reporters);
    const members = await this.members.findMembersByFullName({
      fullNames,
      formation: command.formation,
    });

    const session = NominationSession.createNominationTreeAndAffectMembers({
      ...command,
      formationMembers: members,
      typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS,
    });
    await this.nominationSessionRepository.persist(session);

    return { id: session.id };
  }

  async updateSessionNominationFileObservers(command: {
    sessionId: string;
    files: readonly NominationFile[];
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(
      command.sessionId,
    );
    const existingNominationFiles =
      await this.nominationSessionFileFinder.bySessionAndFileNumber({
        sessionId: session.id,
        fileNumbers: command.files.map(({ fileNumber }) => fileNumber),
      });

    session.updateNominationFileObservers({
      existingNominationFiles,
      nominationFiles: command.files,
    });
    await this.nominationSessionRepository.persist(session);
  }

  async addNominationSessionAttachment(command: {
    sessionId: string;
    file: { id: string };
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(
      command.sessionId,
    );

    session.addAttachment({ file: command.file });
    await this.nominationSessionRepository.persist(session);
  }

  async removeNominationSessionAttachment(command: {
    sessionId: string;
    fileId: string;
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(
      command.sessionId,
    );

    session.removeAttachment({ fileId: command.fileId });
    await this.nominationSessionRepository.persist(session);
  }

  listAttachments(query: {
    sessionId: string;
  }): Promise<ListedNominationSessionAttachmentDto> {
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
    const session = await this.nominationSessionRepository.find(
      command.sessionId,
    );
    console.log(inspect(command.data));
    session.update(command.data);
    await this.nominationSessionRepository.persist(session);
  }

  listNominationSessions(query: {
    typeDeSaisine: TypeDeSaisine;
  }): Promise<ListedNominationSessionsDto> {
    return this.listNominationSessionsQuery.handle(query);
  }

  async defineNominationFileOutcome(command: {
    sessionId: string;
    nominationFileId: string;
    outcome: NominationFileOutcomeEnum | null;
    comment: string | null;
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(
      command.sessionId,
    );

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
    const session = await this.nominationSessionRepository.find(
      command.sessionId,
      { memberIds: [command.userId] },
    );

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

  listCurrentlyAffectedReporters(query: {
    sessionId: string;
  }): Promise<ListedCurrentlyAffectedReportersDto> {
    return this.listCurrentlyAffectedReportersQuery.handle(query);
  }

  countUnaffectedFiles(query: {
    sessionId: string;
    nominationFileIds: readonly string[] | undefined;
  }): Promise<CountedUnaffectedFilesDto> {
    return this.countUnaffectedFilesQuery.handle(query);
  }

  listNominationFilesAsExcel(query: {
    sessionId: string;
  }): Promise<StreamableFile> {
    return this.listNominationFilesAsExcelQuery.handle(query);
  }

  countNominationFilesByStatus(query: {
    sessionId: string;
  }): Promise<NominationFilesStatusCountDto> {
    return this.countNominationFilesByStatusQuery.handle(query);
  }
}
