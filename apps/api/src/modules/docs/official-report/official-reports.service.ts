import { Transactional } from '@nestjs-cls/transactional';
import { forwardRef, Inject, Injectable, NotFoundException, StreamableFile } from '@nestjs/common';

import { Db } from '../../framework/database';
import { MembersService } from '../../members';
import { SimpleAuthService } from '../../simple-auth';
import { DocNominationFileOutcomeEnum } from '../shared/domain/doc-nomination-file-outcome';
import { OfficialReportInvalidation } from '../shared/domain/invalidation/official-report-invalidated.integration-event';
import { AgendaFinder, FoundAgendasDto } from '../shared/infrastructure/finders/agenda.finder';
import { DocsNominationFilesFinder } from '../shared/infrastructure/finders/docs-nomination-files.finder';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';
import { DateOnly, DateOnlyJson } from 'src/utils/date-only';

import { OfficialReport } from './domain/official-report';
import { OfficialReportChairman } from './domain/official-report-chairman';
import { OfficialReportMember } from './domain/official-report-member';
import { OfficialReportMembersList } from './domain/official-report-member-list';
import { OfficialReportSecretary } from './domain/official-report-secretary';
import { OfficialReportSessionMeeting } from './domain/official-report-session-meeting';
import {
  CreatedOfficialReportDto,
  DetailedOfficialReportDocumentDto,
} from './infrastructure/official-reports.dto';
import { DetailsOfficialReportDocumentQuery } from './infrastructure/queries/details-official-report-document.query';
import {
  DetailedOfficialReportMetadataDto,
  DetailsOfficialReportQuery,
} from './infrastructure/queries/details-official-report.query';
import {
  DetailedSessionOfficialReportDto,
  DetailsSessionOfficialReportQuery,
} from './infrastructure/queries/details-session-official-report.query';
import { FindOfficialReportDocumentPdfQuery } from './infrastructure/queries/find-official-report-document-pdf.query';
import { FindOfficialReportDocumentQuery } from './infrastructure/queries/find-official-report-document.query';
import { OfficialReportRepository } from './infrastructure/repositories/official-report.repository';
import { InternalInvalidateOfficialReportUseCase } from './infrastructure/use-cases/invalidate-official-report.use-case';

@Injectable()
export class OfficialReportsService {
  constructor(
    private readonly officialReportRepository: OfficialReportRepository,
    private readonly agendaFinder: AgendaFinder,
    private readonly docsNominationFilesFinder: DocsNominationFilesFinder,
    private readonly detailsOfficialReportMetadataQuery: DetailsOfficialReportQuery,
    private readonly detailsOfficialReportDocumentQuery: DetailsOfficialReportDocumentQuery,
    private readonly detailsSessionOfficialReportQuery: DetailsSessionOfficialReportQuery,
    private readonly findOfficialReportDocumentPdfQuery: FindOfficialReportDocumentPdfQuery,
    private readonly findOfficialReportDocumentQuery: FindOfficialReportDocumentQuery,
    private readonly auth: SimpleAuthService,
    private readonly db: Db,

    private readonly internalInvalidateOfficialReportUseCase: InternalInvalidateOfficialReportUseCase,

    @Inject(forwardRef(() => MembersService))
    private readonly members: MembersService,
    @Inject(forwardRef(() => TransparenceService))
    private readonly sessions: TransparenceService,
  ) {}

  detailsSessionOfficialReport(query: {
    officialReportId: string;
  }): Promise<DetailedSessionOfficialReportDto> {
    return this.detailsSessionOfficialReportQuery.handle(query);
  }

  listAgendasForNewOfficialReport(query: {
    sessionId: string;
    ignoreOfficialReportId?: string;
  }): Promise<FoundAgendasDto> {
    return this.agendaFinder.findNonIncludedInOfficialReport(query);
  }

  @Transactional()
  async createOfficialReport(command: {
    authorId: string;
    sessionMeetingDate: DateOnlyJson;
    sessionMeetingTime: { hours: number; minutes: number; seconds: number };
    sessionMeetingEndingTime: { hours: number; minutes: number; seconds: number };
    hasRenunciation: boolean;
    justiceDepartmentContactId: string;
    chairmanId: string;
    secretaryId: string;
    agendaIds: readonly string[];
    sessionId: string;
    absentMemberIds: readonly string[];
  }): Promise<CreatedOfficialReportDto> {
    const session = await this.sessions.details({
      sessionId: command.sessionId,
    });

    const secretary = await this.auth.detailsUser({
      userId: command.secretaryId,
      impersonationId: undefined,
    });

    const uniqueAgendaIds = new Set(command.agendaIds);
    const { items: agendas } = await this.agendaFinder.findNonIncludedInOfficialReport({
      ids: uniqueAgendaIds,
      formation: session.formation,
    });

    if (agendas.length !== uniqueAgendaIds.size || agendas.length === 0) {
      throw new NotFoundException();
    }

    const firstAgenda = agendas[0]!;
    const chairman = await this.members.internalGetMember({ id: command.chairmanId });
    const members = await this.members.internalFindMembersByFormation({ formation: session.formation });

    const report = OfficialReport.create({
      authorId: command.authorId,
      snapshot: {
        hasRenunciation: command.hasRenunciation,
        justiceDepartmentContactId: BigInt(command.justiceDepartmentContactId),

        agenda: {
          id: firstAgenda.id,
          formation: firstAgenda.formation,
          date: DateOnly.fromJson(firstAgenda.date),
          session: { id: firstAgenda.session.id, date: DateOnly.fromJson(firstAgenda.session.date) },
        },

        sessionMeeting: OfficialReportSessionMeeting.from({
          startTime: command.sessionMeetingTime,
          endTime: command.sessionMeetingEndingTime,
          date: DateOnly.fromJson(command.sessionMeetingDate),
        }),

        // oxlint-disable-next-line typescript/no-misused-spread
        chairman: OfficialReportChairman.from({ ...chairman, expectedFormation: firstAgenda.formation }),
        // oxlint-disable-next-line typescript/no-misused-spread
        secretary: OfficialReportSecretary.from({ ...secretary, id: secretary.userId }),
        members: OfficialReportMembersList.from(
          members.map((member) =>
            OfficialReportMember.from({
              ...member, // oxlint-disable-line typescript/no-misused-spread
              expectedFormation: firstAgenda.formation,
              isAbsent: command.absentMemberIds.includes(member.id),
            }),
          ),
        ),
      },
    });

    await this.officialReportRepository.persist(report);
    return { id: report.id };
  }

  // TODO: refactor
  @Transactional()
  async updateOfficialReport(command: {
    id: string;
    authorId: string;
    sessionMeetingDate: DateOnlyJson;
    sessionMeetingTime: { hours: number; minutes: number; seconds: number };
    sessionMeetingEndingTime: { hours: number; minutes: number; seconds: number };
    hasRenunciation: boolean;
    justiceDepartmentContactId: string;
    chairmanId: string;
    secretaryId: string;
    absentMemberIds: readonly string[];
  }): Promise<void> {
    const report = await this.officialReportRepository.find({ id: command.id });

    const secretary = await this.auth.detailsUser({
      userId: command.secretaryId,
      impersonationId: undefined,
    });
    const chairman = await this.members.internalGetMember({ id: command.chairmanId });
    const members = await this.members.internalFindMembersByFormation({ formation: report.formation });

    const { items: agendas } = await this.agendaFinder.findNonIncludedInOfficialReport({
      formation: report.formation,
      ignoreOfficialReportId: command.id,
      ids: new Set([report.snapshot.meta.agenda.id]),
    });

    if (agendas.length !== 1) {
      throw new NotFoundException();
    }

    const { items: agendaFiles } = await this.docsNominationFilesFinder.findNonReportedByAgendaIds({
      ignoreOfficialReportId: report.id,
      agendaIds: new Set(agendas.map(({ id }) => id)),
    });

    const firstAgenda = agendas[0]!;
    report.update({
      authorId: command.authorId,
      officialReport: {
        hasRenunciation: command.hasRenunciation,
        agenda: {
          id: firstAgenda.id,
          formation: firstAgenda.formation,
          date: DateOnly.fromJson(firstAgenda.date),
          session: { id: firstAgenda.session.id, date: DateOnly.fromJson(firstAgenda.date) },
        },
        justiceDepartmentContactId: BigInt(command.justiceDepartmentContactId),
        sessionMeeting: OfficialReportSessionMeeting.from({
          startTime: command.sessionMeetingTime,
          endTime: command.sessionMeetingEndingTime,
          date: DateOnly.fromJson(command.sessionMeetingDate),
        }),
        // oxlint-disable-next-line typescript/no-misused-spread
        chairman: OfficialReportChairman.from({ ...chairman, expectedFormation: report.formation }),
        // oxlint-disable-next-line typescript/no-misused-spread
        secretary: OfficialReportSecretary.from({ ...secretary, id: secretary.userId }),
        members: OfficialReportMembersList.from(
          members.map((member) =>
            OfficialReportMember.from({
              ...member, // oxlint-disable-line typescript/no-misused-spread
              expectedFormation: report.formation,
              isAbsent: command.absentMemberIds.includes(member.id),
            }),
          ),
        ),
        files: agendaFiles.flatMap((file) =>
          file.outcome !== null
            ? [
                {
                  outcome: file.outcome,
                  nominationFileId: file.id,
                  reporters: file.reporters.map(({ fullTitledName }) => fullTitledName),
                },
              ]
            : [],
        ),
      },
    });

    await this.officialReportRepository.persist(report);
  }

  getOrCreateOfficialReportDocument(query: { id: string; forceNew?: boolean }): Promise<string> {
    return this.findOfficialReportDocumentQuery.handle(query);
  }

  getOrCreateOfficialReportDocumentPdf(query: { id: string; forceNew?: boolean }): Promise<StreamableFile> {
    return this.findOfficialReportDocumentPdfQuery.handle(query);
  }

  detailsOfficialReportMetadata(query: {
    officialReportId: string;
  }): Promise<DetailedOfficialReportMetadataDto> {
    return this.detailsOfficialReportMetadataQuery.handle(query);
  }

  detailsOfficialReportDocument(query: { id: string }): Promise<DetailedOfficialReportDocumentDto> {
    return this.detailsOfficialReportDocumentQuery.handle(query);
  }

  deleteOfficialReport(command: { id: string }): Promise<void> {
    return this.withOfficialReport(command.id, (report) => report.delete());
  }

  resetOfficialReportDocument(command: { id: string }): Promise<void> {
    return this.withOfficialReport(command.id, (report) => report.resetDocument());
  }

  editOfficialReportIntro(command: { id: string; html: string; outdated: boolean }): Promise<void> {
    return this.withOfficialReport(command.id, (report) =>
      report.editIntro({ html: command.html, outdated: command.outdated }),
    );
  }

  resetOfficialReportIntro(command: { id: string }): Promise<void> {
    return this.withOfficialReport(command.id, (report) => report.resetIntro());
  }

  editOfficialReportConclusion(command: { id: string; html: string; outdated: boolean }): Promise<void> {
    return this.withOfficialReport(command.id, (report) =>
      report.editConclusion({ html: command.html, outdated: command.outdated }),
    );
  }

  resetOfficialReportConclusion(command: { id: string }): Promise<void> {
    return this.withOfficialReport(command.id, (report) => report.resetConclusion());
  }

  editOfficialReportFile(command: {
    id: string;
    nominationFileId: string;
    html: string;
    outdated: boolean;
  }): Promise<void> {
    return this.withOfficialReport(command.id, (report) =>
      report.editFile({
        nominationFileId: command.nominationFileId,
        html: command.html,
        outdated: command.outdated,
      }),
    );
  }

  resetOfficialReportFile(command: { id: string; nominationFileId: string }): Promise<void> {
    return this.withOfficialReport(command.id, (report) =>
      report.resetFile({ nominationFileId: command.nominationFileId }),
    );
  }

  editOfficialReportSectionTitle(command: {
    id: string;
    outcome: DocNominationFileOutcomeEnum;
    text: string;
  }): Promise<void> {
    return this.withOfficialReport(command.id, (report) =>
      report.editSectionTitle({ outcome: command.outcome, text: command.text }),
    );
  }

  resetOfficialReportSectionTitle(command: {
    id: string;
    outcome: DocNominationFileOutcomeEnum;
  }): Promise<void> {
    return this.withOfficialReport(command.id, (report) =>
      report.resetSectionTitle({ outcome: command.outcome }),
    );
  }

  editOfficialReportSectionIntro(command: {
    id: string;
    outcome: DocNominationFileOutcomeEnum;
    html: string;
  }): Promise<void> {
    return this.withOfficialReport(command.id, (report) =>
      report.editSectionIntro({ outcome: command.outcome, html: command.html }),
    );
  }

  resetOfficialReportSectionIntro(command: {
    id: string;
    outcome: DocNominationFileOutcomeEnum;
  }): Promise<void> {
    return this.withOfficialReport(command.id, (report) =>
      report.resetSectionIntro({ outcome: command.outcome }),
    );
  }

  async internalInvalidateOfficialReport(command: OfficialReportInvalidation): Promise<void> {
    await this.internalInvalidateOfficialReportUseCase.handle(command);
  }

  @Transactional()
  private async withOfficialReport(id: string, mutation: (report: OfficialReport) => void): Promise<void> {
    const report = await this.officialReportRepository.find({ id });

    mutation(report);

    await this.officialReportRepository.persist(report);
  }
}
