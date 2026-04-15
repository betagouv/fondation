import { Injectable, StreamableFile } from '@nestjs/common';

import { DateOnlyJson, Gender, Magistrat, Role } from 'shared-models';

import { DateOnly } from 'src/utils/date-only';
import {
  UserDutyEnum,
  UserTitleEnum,
} from '../administration/domain/user-enum';
import { PrismaService } from '../framework/database';
import { MembersService } from '../members';
import { SessionService } from '../session/infrastructure/sessions.service';
import { SimpleAuthService } from '../simple-auth';
import { Agenda } from './domain/agenda';
import { OfficialReport } from './domain/official-report';
import {
  CreatedAgendaDto,
  CreatedOfficialReportDto,
} from './infrastructure/docs.dto';
import {
  AgendaNominationFilesFinder,
  FoundAgendaNominationFiles,
} from './infrastructure/finders/agenda-nomination-files.finder';
import {
  DetailedAgendaMetadata,
  DetailsAgendaMetadataQuery,
} from './infrastructure/queries/details-agenda-metadata.query';
import {
  DetailedSessionAgenda,
  DetailsSessionAgendaQuery,
} from './infrastructure/queries/details-session-agenda.query';
import { FindAgendaDocumentPdfQuery } from './infrastructure/queries/find-agenda-document-pdf.query';
import { FindAgendaDocumentQuery } from './infrastructure/queries/find-agenda-document.query';
import {
  FindAgendasForNewOfficialReportQuery,
  FoundAgendasForNewOfficialReportDto,
} from './infrastructure/queries/find-agendas-for-new-official-report.query';
import {
  FindChairmenQuery,
  FoundChairmenDto,
} from './infrastructure/queries/find-chairmen.query';
import {
  FindJusticeContactsQuery,
  FoundJusticeContactsDto,
} from './infrastructure/queries/find-justice-contacts.query';
import {
  FindMembersForNewOfficialReportQuery,
  FoundMembersForNewOfficialReportDto,
} from './infrastructure/queries/find-members-for-new-official-report.query';
import { FindOfficialReportDocumentPdfQuery } from './infrastructure/queries/find-official-report-document-pdf.query';
import { FindOfficialReportDocumentQuery } from './infrastructure/queries/find-official-report-document.query';
import {
  FindSessionDocsQuery,
  FoundSessionDocsDto,
} from './infrastructure/queries/find-session-docs.query';
import {
  DocGenerationSessionReadinessDto,
  IsSessionReadyForDocGenerationQuery,
} from './infrastructure/queries/is-session-ready-for-doc-generation.query';
import {
  ListedSecretariesGeneralForNewOfficialReportDto,
  ListSecretariesGeneralForNewOfficialReportQuery,
} from './infrastructure/queries/list-secretaries-general-for-new-official-report.query';
import { AgendaRepository } from './infrastructure/repositories/agenda.repository';
import { OfficialReportRepository } from './infrastructure/repositories/official-report.repository';

@Injectable()
export class DocsService {
  constructor(
    private readonly findChairmenQuery: FindChairmenQuery,
    private readonly agendaNominationFilesFinder: AgendaNominationFilesFinder,
    private readonly agendaRepository: AgendaRepository,
    private readonly officialReportRepository: OfficialReportRepository,
    private readonly members: MembersService,
    private readonly findAgendaDocumentQuery: FindAgendaDocumentQuery,
    private readonly findAgendaDocumentPdfQuery: FindAgendaDocumentPdfQuery,
    private readonly findSessionDocsQuery: FindSessionDocsQuery,
    private readonly detailsSessionAgendaQuery: DetailsSessionAgendaQuery,
    private readonly isSessionReadyForDocGenerationQuery: IsSessionReadyForDocGenerationQuery,
    private readonly detailsAgendaMetadataQuery: DetailsAgendaMetadataQuery,
    private readonly findJusticeContactsQuery: FindJusticeContactsQuery,
    private readonly findAgendasForNewOfficialReportQuery: FindAgendasForNewOfficialReportQuery,
    private readonly findMembersForNewOfficialReportQuery: FindMembersForNewOfficialReportQuery,
    private readonly listSecretariesGeneralForNewOfficialReportQuery: ListSecretariesGeneralForNewOfficialReportQuery,
    private readonly findOfficialReportDocumentQuery: FindOfficialReportDocumentQuery,
    private readonly findOfficialReportDocumentPdfQuery: FindOfficialReportDocumentPdfQuery,
    private readonly auth: SimpleAuthService,
    private readonly sessions: SessionService,
    private readonly prisma: PrismaService,
  ) {}

  searchChairmen(query: {
    formation: Magistrat.Formation | undefined;
  }): Promise<FoundChairmenDto> {
    return this.findChairmenQuery.handle(query);
  }

  findAgendaNominationFiles(query: {
    sessionId: string;
    ignoreAgendaId?: string;
  }): Promise<FoundAgendaNominationFiles> {
    return this.agendaNominationFilesFinder.find(query);
  }

  async createAgenda(command: {
    authorId: string;
    sessionId: string;
    chairmanId: string;
    date: DateOnlyJson;
    sessionMeetingDate: DateOnlyJson;
    nominationFileIds: readonly string[];
  }): Promise<CreatedAgendaDto> {
    const chairman = await this.members.internalGetMember({
      id: command.chairmanId,
    });

    const { items: nominationFiles } =
      await this.agendaNominationFilesFinder.find({
        sessionId: command.sessionId,
        ids: command.nominationFileIds,
      });

    const agenda = Agenda.create({
      chairman,
      nominationFiles,
      sessionId: command.sessionId,
      authorId: command.authorId,
      date: DateOnly.fromJson(command.date),
      sessionMeetingDate: DateOnly.fromJson(command.sessionMeetingDate),
    });

    await this.agendaRepository.persist(agenda);

    return { id: agenda.id };
  }

  async updateAgenda(command: {
    agendaId: string;
    authorId: string;
    chairmanId: string;
    date: DateOnlyJson;
    sessionMeetingDate: DateOnlyJson;
    nominationFileIds: readonly string[];
  }): Promise<void> {
    const agenda = await this.agendaRepository.find({
      agendaId: command.agendaId,
    });

    const chairman = await this.members.internalGetMember({
      id: command.chairmanId,
    });

    const { items: nominationFiles } =
      await this.agendaNominationFilesFinder.find({
        sessionId: agenda.sessionId,
        ids: command.nominationFileIds,
        ignoreAgendaId: command.agendaId,
      });

    agenda.update({
      chairman,
      nominationFiles,
      authorId: command.authorId,
      date: DateOnly.fromJson(command.date),
      sessionMeetingDate: DateOnly.fromJson(command.sessionMeetingDate),
    });

    await this.agendaRepository.persist(agenda);
  }

  async deleteAgenda(command: { agendaId: string }): Promise<void> {
    const agenda = await this.agendaRepository.find(command);
    agenda.delete();
    await this.agendaRepository.persist(agenda);
  }

  getOrCreateAgendaDocument(query: {
    id: string;
    forceNew?: boolean;
  }): Promise<string> {
    return this.findAgendaDocumentQuery.handle(query);
  }

  getOrCreateAgendaDocumentPdf(query: {
    id: string;
    forceNew?: boolean;
  }): Promise<StreamableFile> {
    return this.findAgendaDocumentPdfQuery.handle(query);
  }

  findSessionDocs(query: { sessionId: string }): Promise<FoundSessionDocsDto> {
    return this.findSessionDocsQuery.handle(query);
  }

  detailsSessionAgenda(query: {
    sessionId: string;
    agendaId: string;
  }): Promise<DetailedSessionAgenda> {
    return this.detailsSessionAgendaQuery.handle(query);
  }

  isSessionReadyForDocGeneration(query: {
    sessionId: string;
  }): Promise<DocGenerationSessionReadinessDto> {
    return this.isSessionReadyForDocGenerationQuery.handle(query);
  }

  detailsAgendaMetadata(query: {
    agendaId: string;
  }): Promise<DetailedAgendaMetadata> {
    return this.detailsAgendaMetadataQuery.handle(query);
  }

  searchJusticeContacts(query: {
    search: string;
  }): Promise<FoundJusticeContactsDto> {
    return this.findJusticeContactsQuery.handle(query);
  }

  async createJusticeContact(command: {
    name: string;
    authorId: string;
  }): Promise<{ id: string; name: string }> {
    const result = await this.prisma.justiceDepartmentContact.create({
      data: { name: command.name, authorId: command.authorId },
    });

    return { id: String(result.id), name: result.name };
  }

  listAgendasForNewOfficialReport(query: {
    sessionId: string;
  }): Promise<FoundAgendasForNewOfficialReportDto> {
    return this.findAgendasForNewOfficialReportQuery.handle(query);
  }

  listMembersForNewOfficialReport(query: {
    sessionId: string;
  }): Promise<FoundMembersForNewOfficialReportDto> {
    return this.findMembersForNewOfficialReportQuery.handle(query);
  }

  listSecretariesGeneralForNewOfficialReport(): Promise<ListedSecretariesGeneralForNewOfficialReportDto> {
    return this.listSecretariesGeneralForNewOfficialReportQuery.handle();
  }

  async createOfficialReport(command: {
    authorId: string;
    sessionMeetingDate: DateOnlyJson;
    sessionMeetingTime: { hours: number; minutes: number; seconds: number };
    hasRenunciation: boolean;
    justiceDepartmentContactId: number;
    chairmanId: string;
    secretaryId: string;
    agendaIds: readonly string[];
    memberIds: readonly string[];
    sessionId: string;
  }): Promise<CreatedOfficialReportDto> {
    const session = await this.sessions.details({
      sessionId: command.sessionId,
    });

    const secretary = await this.auth.detailsUser({
      userId: command.secretaryId,
      impersonationId: undefined,
    });

    const [chairman, members] = await Promise.all([
      this.members.internalGetMember({ id: command.chairmanId }),
      this.members.internalFindMembersByIds({ ids: command.memberIds }),
    ]);

    const toOfficialReportUser = (m: {
      id: string;
      firstName: string;
      lastName: string;
      gender: Gender;
      title: UserTitleEnum | null;
      displayTitle: string | null;
      duty: UserDutyEnum | null;
      role: Role;
    }) => ({
      id: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      gender: m.gender,
      title: m.title,
      displayTitle: m.displayTitle,
      duty: m.duty ?? null,
      role: m.role,
    });

    const report = OfficialReport.create({
      sessionMeetingDate: DateOnly.fromJson(command.sessionMeetingDate),
      sessionMeetingStartingTime: command.sessionMeetingTime,
      hasRenunciation: command.hasRenunciation,
      justiceDepartmentContactId: command.justiceDepartmentContactId,
      chairman: toOfficialReportUser(chairman),
      secretary: toOfficialReportUser({ ...secretary, id: secretary.userId }),
      agendaIds: command.agendaIds,
      members: members.map(toOfficialReportUser),
      authorId: command.authorId,
      formation: session.formation,
    });

    await this.officialReportRepository.persist(report);

    return { id: report.id };
  }

  getOrCreateOfficialReportDocument(query: {
    id: string;
    forceNew?: boolean;
  }): Promise<string> {
    return this.findOfficialReportDocumentQuery.handle(query);
  }

  getOrCreateOfficialReportDocumentPdf(query: {
    id: string;
    forceNew?: boolean;
  }): Promise<StreamableFile> {
    return this.findOfficialReportDocumentPdfQuery.handle(query);
  }
}
