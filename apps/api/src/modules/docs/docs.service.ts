import { DateOnlyJson, Magistrat } from 'shared-models';

import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { DateOnly } from 'src/utils/date-only';
import { TimeOnly } from 'src/utils/time-only';
import { PrismaService } from '../framework/database';
import { MembersService } from '../members';
import { SessionService } from '../session/infrastructure/sessions.service';
import { SimpleAuthService } from '../simple-auth';
import { Agenda } from './domain/agenda';
import { JusticePresentationPlan } from './domain/justice-presentation-plan';
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
  AgendaFinder,
  FoundAgendasDto,
} from './infrastructure/finders/agenda.finder';
import {
  DetailedAgendaMetadata,
  DetailsAgendaMetadataQuery,
} from './infrastructure/queries/details-agenda-metadata.query';
import {
  DetailedOfficialReportMetadataDto,
  DetailsOfficialReportQuery,
} from './infrastructure/queries/details-official-report.query';
import {
  DetailedPresentationPlanMetadataDto,
  DetailsPresentationPlanMetadataQuery,
} from './infrastructure/queries/details-presentation-plan-metadata.query';
import {
  DetailedSessionAgenda,
  DetailsSessionAgendaQuery,
} from './infrastructure/queries/details-session-agenda.query';
import {
  DetailedSessionOfficialReportDto,
  DetailsSessionOfficialReportQuery,
} from './infrastructure/queries/details-session-official-report.query';
import { FindAgendaDocumentPdfQuery } from './infrastructure/queries/find-agenda-document-pdf.query';
import { FindAgendaDocumentQuery } from './infrastructure/queries/find-agenda-document.query';
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
import { FindPresentationPlanDocumentPdfQuery } from './infrastructure/queries/find-presentation-plan-document-pdf.query';
import { FindPresentationPlanDocumentQuery } from './infrastructure/queries/find-presentation-plan-document.query';
import {
  FindSessionDocsQuery,
  FoundSessionDocsDto,
} from './infrastructure/queries/find-session-docs.query';
import {
  DocGenerationSessionReadinessDto,
  IsSessionReadyForDocGenerationQuery,
} from './infrastructure/queries/is-session-ready-for-doc-generation.query';
import {
  ListedNonPresentedPlansDto,
  ListNonPresentedPlansQuery,
} from './infrastructure/queries/list-non-presented-plans.query';
import {
  ListedSecretariesGeneralDto,
  ListSecretariesGeneralQuery,
} from './infrastructure/queries/list-secretaries-general.query';
import { AgendaRepository } from './infrastructure/repositories/agenda.repository';
import { JusticePresentationPlanRepository } from './infrastructure/repositories/justice-presentation-plan.repository';
import { OfficialReportRepository } from './infrastructure/repositories/official-report.repository';

@Injectable()
export class DocsService {
  constructor(
    private readonly findChairmenQuery: FindChairmenQuery,
    private readonly agendaNominationFilesFinder: AgendaNominationFilesFinder,
    private readonly agendaRepository: AgendaRepository,
    private readonly officialReportRepository: OfficialReportRepository,
    private readonly members: MembersService,
    private readonly agendaFinder: AgendaFinder,
    private readonly findAgendaDocumentQuery: FindAgendaDocumentQuery,
    private readonly findAgendaDocumentPdfQuery: FindAgendaDocumentPdfQuery,
    private readonly findSessionDocsQuery: FindSessionDocsQuery,
    private readonly detailsSessionAgendaQuery: DetailsSessionAgendaQuery,
    private readonly detailsSessionOfficialReportQuery: DetailsSessionOfficialReportQuery,
    private readonly isSessionReadyForDocGenerationQuery: IsSessionReadyForDocGenerationQuery,
    private readonly detailsAgendaMetadataQuery: DetailsAgendaMetadataQuery,
    private readonly findJusticeContactsQuery: FindJusticeContactsQuery,
    private readonly findMembersForNewOfficialReportQuery: FindMembersForNewOfficialReportQuery,
    private readonly listSecretariesGeneralQuery: ListSecretariesGeneralQuery,
    private readonly findOfficialReportDocumentQuery: FindOfficialReportDocumentQuery,
    private readonly findOfficialReportDocumentPdfQuery: FindOfficialReportDocumentPdfQuery,
    private readonly detailsOfficialReportMetadataQuery: DetailsOfficialReportQuery,
    private readonly detailsPresentationPlanMetadataQuery: DetailsPresentationPlanMetadataQuery,
    private readonly justicePresentationPlanRepository: JusticePresentationPlanRepository,
    private readonly findPresentationPlanDocumentQuery: FindPresentationPlanDocumentQuery,
    private readonly findPresentationPlanDocumentPdfQuery: FindPresentationPlanDocumentPdfQuery,
    private readonly listNonPresentedPlansQuery: ListNonPresentedPlansQuery,
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

  detailsSessionOfficialReport(query: {
    officialReportId: string;
  }): Promise<DetailedSessionOfficialReportDto> {
    return this.detailsSessionOfficialReportQuery.handle(query);
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
    ignoreOfficialReportId?: string;
  }): Promise<FoundAgendasDto> {
    return this.agendaFinder.findNonIncludedInOfficialReport(query);
  }

  listMembersForNewOfficialReport(query: {
    sessionId: string;
  }): Promise<FoundMembersForNewOfficialReportDto> {
    return this.findMembersForNewOfficialReportQuery.handle(query);
  }

  listSecretariesGeneral(): Promise<ListedSecretariesGeneralDto> {
    return this.listSecretariesGeneralQuery.handle();
  }

  async createOfficialReport(command: {
    authorId: string;
    sessionMeetingDate: DateOnlyJson;
    sessionMeetingTime: { hours: number; minutes: number; seconds: number };
    hasRenunciation: boolean;
    justiceDepartmentContactId: string;
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

    const uniqueAgendaIds = new Set(command.agendaIds);
    const { items: agendas } =
      await this.agendaFinder.findNonIncludedInOfficialReport({
        ids: uniqueAgendaIds,
        formation: session.formation,
      });

    if (agendas.length !== uniqueAgendaIds.size) {
      throw new NotFoundException();
    }

    const [chairman, members] = await Promise.all([
      this.members.internalGetMember({ id: command.chairmanId }),
      this.members.internalFindMembersByIds({ ids: command.memberIds }),
    ]);

    const report = OfficialReport.create({
      agendas,
      members,
      chairman,
      authorId: command.authorId,
      formation: session.formation,
      hasRenunciation: command.hasRenunciation,
      secretary: { ...secretary, id: secretary.userId },
      sessionMeetingStartingTime: command.sessionMeetingTime,
      sessionMeetingDate: DateOnly.fromJson(command.sessionMeetingDate),
      justiceDepartmentContactId: command.justiceDepartmentContactId,
    });

    await this.officialReportRepository.persist(report);
    return { id: report.id };
  }

  // TODO: refactor
  async updateOfficialReport(command: {
    id: string;
    authorId: string;
    sessionMeetingDate: DateOnlyJson;
    sessionMeetingTime: { hours: number; minutes: number; seconds: number };
    hasRenunciation: boolean;
    justiceDepartmentContactId: string;
    chairmanId: string;
    secretaryId: string;
    agendaIds: readonly string[];
    memberIds: readonly string[];
  }): Promise<void> {
    const secretary = await this.auth.detailsUser({
      userId: command.secretaryId,
      impersonationId: undefined,
    });

    const [chairman, members] = await Promise.all([
      this.members.internalGetMember({ id: command.chairmanId }),
      this.members.internalFindMembersByIds({ ids: command.memberIds }),
    ]);

    const report = await this.officialReportRepository.find({
      id: command.id,
    });

    const uniqueAgendaIds = new Set(command.agendaIds);
    const { items: agendas } =
      await this.agendaFinder.findNonIncludedInOfficialReport({
        ids: uniqueAgendaIds,
        formation: report.formation,
        ignoreOfficialReportId: command.id,
      });

    if (agendas.length !== uniqueAgendaIds.size) {
      throw new NotFoundException();
    }

    report.update({
      agendas,
      members,
      chairman,
      secretary: { ...secretary, id: secretary.userId },

      authorId: command.authorId,
      hasRenunciation: command.hasRenunciation,
      sessionMeetingStartingTime: command.sessionMeetingTime,
      justiceDepartmentContactId: command.justiceDepartmentContactId,
      sessionMeetingDate: DateOnly.fromJson(command.sessionMeetingDate),
    });

    await this.officialReportRepository.persist(report);
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

  detailsOfficialReportMetadata(query: {
    officialReportId: string;
  }): Promise<DetailedOfficialReportMetadataDto> {
    return this.detailsOfficialReportMetadataQuery.handle(query);
  }

  async deleteOfficialReport(command: { id: string }): Promise<void> {
    const officialReport = await this.officialReportRepository.find(command);
    officialReport.delete();
    this.officialReportRepository.persist(officialReport);
  }

  findPresentationPlanAgendas(query: {
    ignorePlanId: string | undefined;
  }): Promise<FoundAgendasDto> {
    return this.agendaFinder.findNonIncludedInPresentationPlan(query);
  }

  detailsPresentationPlanMetadata(query: {
    id: string;
  }): Promise<DetailedPresentationPlanMetadataDto> {
    return this.detailsPresentationPlanMetadataQuery.handle(query);
  }

  async createPresentationPlan(command: {
    date: DateOnlyJson;
    time: TimeOnly;
    authorId: string;
    chairmanId: string;
    secretaryId: string;
    justiceContactId: string;
    agendas: { id: string; comment: string | null }[];
  }): Promise<{ id: string }> {
    const agendasById = new Map(command.agendas.map((a) => [a.id, a] as const));
    const agendaIds = new Set(agendasById.keys());
    const { items } = await this.agendaFinder.findNonIncludedInPresentationPlan(
      { ids: agendaIds },
    );

    if (items.length !== agendaIds.size) throw new NotFoundException();

    const agendas = items.map((item) => {
      const agenda = agendasById.get(item.id);
      return { ...item, comment: agenda?.comment ?? null };
    });

    const chairman = await this.members.internalGetMember({
      id: command.chairmanId,
    });

    const secretary = await this.auth.detailsUser({
      userId: command.secretaryId,
      impersonationId: undefined,
    });

    const plan = JusticePresentationPlan.create({
      agendas,
      chairman,
      secretary: { ...secretary, id: secretary.userId },
      justiceContactId: command.justiceContactId,
      authorId: command.authorId,
      time: command.time,
      date: DateOnly.fromJson(command.date),
    });

    await this.justicePresentationPlanRepository.persist(plan);

    return { id: plan.id };
  }

  async updatePresentationPlan(command: {
    id: string;
    date: DateOnlyJson;
    time: TimeOnly;
    authorId: string;
    chairmanId: string;
    secretaryId: string;
    justiceContactId: string;
    agendas: { id: string; comment: string | null }[];
  }): Promise<void> {
    const plan = await this.justicePresentationPlanRepository.find({
      id: command.id,
    });

    const agendasById = new Map(command.agendas.map((a) => [a.id, a] as const));
    const agendaIds = new Set(agendasById.keys());
    const { items } = await this.agendaFinder.findNonIncludedInPresentationPlan(
      { ids: agendaIds, ignorePlanId: command.id },
    );

    if (items.length !== agendaIds.size) throw new NotFoundException();

    const agendas = items.map((item) => {
      const agenda = agendasById.get(item.id);
      return { ...item, comment: agenda?.comment ?? null };
    });

    const chairman = await this.members.internalGetMember({
      id: command.chairmanId,
    });

    const secretary = await this.auth.detailsUser({
      userId: command.secretaryId,
      impersonationId: undefined,
    });

    plan.update({
      agendas,
      chairman,
      secretary: { ...secretary, id: secretary.userId },
      justiceContactId: command.justiceContactId,
      authorId: command.authorId,
      time: command.time,
      date: DateOnly.fromJson(command.date),
    });

    await this.justicePresentationPlanRepository.persist(plan);
  }

  async deletePresentationPlan(command: { id: string }): Promise<void> {
    const plan = await this.justicePresentationPlanRepository.find({
      id: command.id,
    });

    plan.delete();

    await this.justicePresentationPlanRepository.persist(plan);
  }

  findPresentationPlanDocument(query: {
    id: string;
    forceNew?: boolean;
  }): Promise<string> {
    return this.findPresentationPlanDocumentQuery.handle(query);
  }

  findPresentationPlanDocumentPdf(query: {
    id: string;
    forceNew?: boolean;
  }): Promise<StreamableFile> {
    return this.findPresentationPlanDocumentPdfQuery.handle(query);
  }

  listNonPresentedPlans(): Promise<ListedNonPresentedPlansDto> {
    return this.listNonPresentedPlansQuery.handle();
  }

  async presentPlan(command: { id: string }): Promise<void> {
    const plan = await this.justicePresentationPlanRepository.find({
      id: command.id,
    });
    plan.present();
    await this.justicePresentationPlanRepository.persist(plan);
  }

  async unPresentPlan(command: { id: string }): Promise<void> {
    const plan = await this.justicePresentationPlanRepository.find({
      id: command.id,
    });
    plan.unPresent();
    await this.justicePresentationPlanRepository.persist(plan);
  }
}
