import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';

import { DateOnlyJson } from 'shared-models';

import { PrismaService } from '../framework/database';
import { Pagination } from '../framework/pagination';
import { MembersService } from '../members';
import { SessionService } from '../session/infrastructure/sessions.service';
import { SimpleAuthService } from '../simple-auth';
import { Prisma } from 'src/generated/prisma/client';
import { Files } from 'src/modules/framework/files';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { DateOnly } from 'src/utils/date-only';
import { assertIsDefined } from 'src/utils/is-defined';
import { partition } from 'src/utils/iterables';
import { TimeOnly } from 'src/utils/time-only';

import { Agenda } from './domain/agenda';
import { JusticePresentationPlan } from './domain/justice-presentation-plan';
import { OfficialReport } from './domain/official-report';
import { CreatedAgendaDto, CreatedOfficialReportDto, FoundDocsMembersDto } from './infrastructure/docs.dto';
import { AgendaFinder, FoundAgendasDto } from './infrastructure/finders/agenda.finder';
import {
  DocsNominationFilesFinder,
  FoundDocsNominationFiles,
} from './infrastructure/finders/docs-nomination-files.finder';
import { ReportedNominationFilesFinder } from './infrastructure/finders/reported-nomination-files.finder';
import {
  DetailedAgendaFilesDto,
  DetailsAgendaFilesQuery,
} from './infrastructure/queries/details-agenda-files.query';
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
import { DetailsPresentationPlanPdfDocumentQuery } from './infrastructure/queries/details-presentation-plan-pdf-document.query';
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
import { FindChairmenQuery, FoundChairmenDto } from './infrastructure/queries/find-chairmen.query';
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
import { FindSessionDocsQuery, FoundSessionDocsDto } from './infrastructure/queries/find-session-docs.query';
import {
  InternalFindNominationFilesLinkedDocsQuery,
  InternalFoundNominationFilesLinkedDocsDto,
} from './infrastructure/queries/internal-find-nomination-files-linked-docs.query';
import {
  DocGenerationSessionReadinessDto,
  IsSessionReadyForDocGenerationQuery,
} from './infrastructure/queries/is-session-ready-for-doc-generation.query';
import {
  ListedNonPresentedPlansDto,
  ListNonPresentedPlansQuery,
} from './infrastructure/queries/list-non-presented-plans.query';
import {
  ListedPresentedPlansDto,
  ListPresentedPlansQuery,
} from './infrastructure/queries/list-presented-plans.query';
import {
  ListedSecretariesGeneralDto,
  ListSecretariesGeneralQuery,
} from './infrastructure/queries/list-secretaries-general.query';
import { AgendaRepository } from './infrastructure/repositories/agenda.repository';
import { JusticePresentationPlanRepository } from './infrastructure/repositories/justice-presentation-plan.repository';
import { OfficialReportRepository } from './infrastructure/repositories/official-report.repository';
import { updatePresentationTimeDocMeetingSessionEndingTime } from './infrastructure/services/renderers/templates/presentation-plan.html';

@Injectable()
export class DocsService {
  private readonly logger = new Logger(DocsService.name);

  constructor(
    private readonly files: Files,
    private readonly agendaRepository: AgendaRepository,
    private readonly officialReportRepository: OfficialReportRepository,

    private readonly agendaFinder: AgendaFinder,
    private readonly docsNominationFilesFinder: DocsNominationFilesFinder,
    private readonly reportedNominationFilesFinder: ReportedNominationFilesFinder,

    private readonly detailsAgendaMetadataQuery: DetailsAgendaMetadataQuery,
    private readonly detailsAgendaFilesQuery: DetailsAgendaFilesQuery,
    private readonly detailsOfficialReportMetadataQuery: DetailsOfficialReportQuery,
    private readonly detailsPresentationPlanMetadataQuery: DetailsPresentationPlanMetadataQuery,
    private readonly detailsPresentationPlanPdfDocumentQuery: DetailsPresentationPlanPdfDocumentQuery,
    private readonly detailsSessionAgendaQuery: DetailsSessionAgendaQuery,
    private readonly detailsSessionOfficialReportQuery: DetailsSessionOfficialReportQuery,
    private readonly findAgendaDocumentPdfQuery: FindAgendaDocumentPdfQuery,
    private readonly findAgendaDocumentQuery: FindAgendaDocumentQuery,
    private readonly findChairmenQuery: FindChairmenQuery,
    private readonly findJusticeContactsQuery: FindJusticeContactsQuery,
    private readonly findMembersForNewOfficialReportQuery: FindMembersForNewOfficialReportQuery,
    private readonly findOfficialReportDocumentPdfQuery: FindOfficialReportDocumentPdfQuery,
    private readonly findOfficialReportDocumentQuery: FindOfficialReportDocumentQuery,
    private readonly findPresentationPlanDocumentPdfQuery: FindPresentationPlanDocumentPdfQuery,
    private readonly findPresentationPlanDocumentQuery: FindPresentationPlanDocumentQuery,
    private readonly findSessionDocsQuery: FindSessionDocsQuery,
    private readonly internalFindNominationFileLinkedDocsQuery: InternalFindNominationFilesLinkedDocsQuery,
    private readonly isSessionReadyForDocGenerationQuery: IsSessionReadyForDocGenerationQuery,
    private readonly justicePresentationPlanRepository: JusticePresentationPlanRepository,
    private readonly listNonPresentedPlansQuery: ListNonPresentedPlansQuery,
    private readonly listPresentedPlansQuery: ListPresentedPlansQuery,
    private readonly listSecretariesGeneralQuery: ListSecretariesGeneralQuery,

    private readonly auth: SimpleAuthService,
    private readonly prisma: PrismaService,

    @Inject(forwardRef(() => MembersService))
    private readonly members: MembersService,
    @Inject(forwardRef(() => SessionService))
    private readonly sessions: SessionService,
  ) {}

  /** @deprecated prefer {@link findDocsMembers} */
  searchChairmen(query: { formation: FormationEnum | undefined }): Promise<FoundChairmenDto> {
    return this.findChairmenQuery.handle(query);
  }

  findAgendaNominationFiles(query: { sessionId: string }): Promise<FoundDocsNominationFiles> {
    return this.docsNominationFilesFinder.findNonReported(query);
  }

  async createAgenda(command: {
    authorId: string;
    sessionId: string;
    chairmanId: string;
    date: DateOnlyJson;
    sessionMeetingDate: DateOnlyJson;
    nominationFileIds: readonly string[];
  }): Promise<CreatedAgendaDto> {
    return this.prisma.$transaction(async (tx) => {
      const chairman = await this.members.internalGetMember({
        tx,
        id: command.chairmanId,
      });

      const { items: nominationFiles } = await this.docsNominationFilesFinder.find({
        tx,
        sessionId: command.sessionId,
        ids: command.nominationFileIds,
      });

      const reportedFiles = await this.reportedNominationFilesFinder.find({
        tx,
        fileIds: new Set(nominationFiles.map(({ id }) => id)),
      });

      const agenda = Agenda.create({
        chairman,
        reportedFiles,
        authorId: command.authorId,
        sessionId: command.sessionId,
        date: DateOnly.fromJson(command.date),
        sessionMeetingDate: DateOnly.fromJson(command.sessionMeetingDate),
        nominationFiles: nominationFiles.map((f) => ({
          id: f.id,
          number: f.number,
          outcome: f.outcome,
          name: f.magistrat.name,
          grade: f.magistrat.position.grade,
          currentPosition: f.magistrat.position.label,
          targetedGrade: f.targetPosition.grade,
          targetedPosition: f.targetPosition.label,
          reporters: f.reporters.map((r) => r.fullTitledName),
        })),
      });

      await this.agendaRepository.persist(agenda, tx);

      return { id: agenda.id };
    });
  }

  async updateAgenda(command: {
    agendaId: string;
    authorId: string;
    chairmanId: string;
    date: DateOnlyJson;
    sessionMeetingDate: DateOnlyJson;
    nominationFileIds: readonly string[];
  }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const agenda = await this.agendaRepository.find({
        tx,
        agendaId: command.agendaId,
      });

      const chairman = await this.members.internalGetMember({
        tx,
        id: command.chairmanId,
      });

      const { items: nominationFiles } = await this.docsNominationFilesFinder.find({
        tx,
        sessionId: agenda.sessionId,
        ids: command.nominationFileIds,
      });

      const reportedFiles = await this.reportedNominationFilesFinder.find({
        tx,
        fileIds: new Set(nominationFiles.map(({ id }) => id)),
        ignoreOfficialReportId: agenda.officialReportId ?? undefined,
      });

      agenda.update({
        chairman,
        reportedFiles,
        authorId: command.authorId,
        date: DateOnly.fromJson(command.date),
        sessionMeetingDate: DateOnly.fromJson(command.sessionMeetingDate),
        nominationFiles: nominationFiles.map((f) => ({
          id: f.id,
          number: f.number,
          outcome: f.outcome,
          name: f.magistrat.name,
          grade: f.magistrat.position.grade,
          currentPosition: f.magistrat.position.label,
          targetedGrade: f.targetPosition.grade,
          targetedPosition: f.targetPosition.label,
          reporters: f.reporters.map((r) => r.fullTitledName),
        })),
      });

      await this.agendaRepository.persist(agenda, tx);
    });
  }

  async deleteAgenda(command: { agendaId: string }): Promise<void> {
    return this.prisma.$transaction(async (tx) => {
      const agenda = await this.agendaRepository.find({ ...command, tx });
      agenda.delete();
      await this.agendaRepository.persist(agenda, tx);
    });
  }

  getOrCreateAgendaDocument(query: { id: string; forceNew?: boolean }): Promise<string> {
    return this.findAgendaDocumentQuery.handle(query);
  }

  getOrCreateAgendaDocumentPdf(query: { id: string; forceNew?: boolean }): Promise<StreamableFile> {
    return this.findAgendaDocumentPdfQuery.handle(query);
  }

  findSessionDocs(query: { sessionId: string }): Promise<FoundSessionDocsDto> {
    return this.findSessionDocsQuery.handle(query);
  }

  detailsSessionAgenda(query: { sessionId: string; agendaId: string }): Promise<DetailedSessionAgenda> {
    return this.detailsSessionAgendaQuery.handle(query);
  }

  detailsSessionOfficialReport(query: {
    officialReportId: string;
  }): Promise<DetailedSessionOfficialReportDto> {
    return this.detailsSessionOfficialReportQuery.handle(query);
  }

  isSessionReadyForDocGeneration(query: { sessionId: string }): Promise<DocGenerationSessionReadinessDto> {
    return this.isSessionReadyForDocGenerationQuery.handle(query);
  }

  detailsAgendaMetadata(query: { agendaId: string }): Promise<DetailedAgendaMetadata> {
    return this.detailsAgendaMetadataQuery.handle(query);
  }

  async resetAgendaDocument(command: { id: string }): Promise<void> {
    const agenda = await this.prisma.agenda.findUnique({
      where: { id: command.id },
      select: { pdf: { select: { id: true, path: true } } },
    });
    if (!agenda) throw new NotFoundException();

    await this.prisma.agenda.update({
      where: { id: command.id },
      data: { html: null, isManuallyEdited: false, pdfFileId: null },
    });

    if (agenda.pdf) this.files.delete([agenda.pdf]);
  }

  async resetOfficialReportDocument(command: { id: string }): Promise<void> {
    const report = await this.prisma.officialReport.findUnique({
      where: { id: command.id },
      select: { pdf: { select: { id: true, path: true } } },
    });
    if (!report) throw new NotFoundException();

    await this.prisma.officialReport.update({
      where: { id: command.id },
      data: { html: null, isManuallyEdited: false, pdfId: null },
    });

    if (report.pdf) this.files.delete([report.pdf]);
  }

  async resetPresentationPlanDocument(command: { id: string }): Promise<void> {
    const plan = await this.prisma.justicePresentationPlan.findUnique({
      where: { id: command.id },
      select: { pdf: { select: { id: true, path: true } } },
    });
    if (!plan) throw new NotFoundException();

    await this.prisma.justicePresentationPlan.update({
      where: { id: command.id },
      data: { html: null, isManuallyEdited: false, pdfId: null },
    });

    if (plan.pdf) this.files.delete([plan.pdf]);
  }

  async updateAgendaHtml(command: { id: string; html: Buffer }): Promise<void> {
    await this.prisma.agenda.update({
      where: { id: command.id },
      data: { html: command.html.toString('utf-8'), isManuallyEdited: true },
    });
  }

  async updateOfficialReportHtml(command: { id: string; html: Buffer }): Promise<void> {
    await this.prisma.officialReport.update({
      where: { id: command.id },
      data: { html: command.html.toString('utf-8'), isManuallyEdited: true },
    });
  }

  async updatePresentationPlanHtml(command: { id: string; html: Buffer }): Promise<void> {
    await this.prisma.justicePresentationPlan.update({
      where: { id: command.id },
      data: { html: command.html.toString('utf-8'), isManuallyEdited: true },
    });
  }

  searchJusticeContacts(query: { search: string }): Promise<FoundJusticeContactsDto> {
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

  /** @deprecated prefer {@link findDocsMembers} */
  listMembersForNewOfficialReport(query: {
    sessionId: string;
  }): Promise<FoundMembersForNewOfficialReportDto> {
    return this.findMembersForNewOfficialReportQuery.handle(query);
  }

  async findDocsMembers(query: { formation: FormationEnum }): Promise<FoundDocsMembersDto> {
    const items = await this.members.internalFindMembersByFormation(query);
    return { items: items.map(({ role: _r, ...m }) => m) };
  }

  listSecretariesGeneral(): Promise<ListedSecretariesGeneralDto> {
    return this.listSecretariesGeneralQuery.handle();
  }

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
    return this.prisma.$transaction(async (tx) => {
      const session = await this.sessions.details({
        tx,
        sessionId: command.sessionId,
      });

      const secretary = await this.auth.detailsUser({
        tx,
        userId: command.secretaryId,
        impersonationId: undefined,
      });

      const uniqueAgendaIds = new Set(command.agendaIds);
      const { items: agendas } = await this.agendaFinder.findNonIncludedInOfficialReport({
        tx,
        ids: uniqueAgendaIds,
        formation: session.formation,
      });

      if (agendas.length !== uniqueAgendaIds.size) {
        throw new NotFoundException();
      }

      const chairman = await this.members.internalGetMember({ id: command.chairmanId, tx });
      const members = await this.members.internalFindMembersByFormation({ formation: session.formation, tx });

      const report = OfficialReport.create({
        agendas,
        members,
        chairman,
        authorId: command.authorId,
        formation: session.formation,
        hasRenunciation: command.hasRenunciation,
        // oxlint-disable-next-line typescript/no-misused-spread
        secretary: { ...secretary, id: secretary.userId },
        sessionMeetingStartingTime: command.sessionMeetingTime,
        sessionMeetingEndingTime: command.sessionMeetingEndingTime,
        sessionMeetingDate: DateOnly.fromJson(command.sessionMeetingDate),
        justiceDepartmentContactId: command.justiceDepartmentContactId,
        absentMembers: new Set(command.absentMemberIds),
      });

      await this.officialReportRepository.persist(report, tx);
      return { id: report.id };
    });
  }

  // TODO: refactor
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
    agendaIds: readonly string[];
    absentMemberIds: readonly string[];
  }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const secretary = await this.auth.detailsUser({
        userId: command.secretaryId,
        impersonationId: undefined,
        tx,
      });

      const report = await this.officialReportRepository.find({ tx, id: command.id });
      const chairman = await this.members.internalGetMember({ id: command.chairmanId, tx });
      const members = await this.members.internalFindMembersByFormation({ formation: report.formation, tx });

      const uniqueAgendaIds = new Set(command.agendaIds);
      const { items: agendas } = await this.agendaFinder.findNonIncludedInOfficialReport({
        tx,
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
        // oxlint-disable-next-line typescript/no-misused-spread
        secretary: { ...secretary, id: secretary.userId },

        authorId: command.authorId,
        hasRenunciation: command.hasRenunciation,
        sessionMeetingStartingTime: command.sessionMeetingTime,
        sessionMeetingEndingTime: command.sessionMeetingEndingTime,
        justiceDepartmentContactId: command.justiceDepartmentContactId,
        sessionMeetingDate: DateOnly.fromJson(command.sessionMeetingDate),
        absentMembers: new Set(command.absentMemberIds),
      });

      await this.officialReportRepository.persist(report, tx);
    });
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

  async deleteOfficialReport(command: { id: string }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const officialReport = await this.officialReportRepository.find({ ...command, tx });
      officialReport.delete();
      await this.officialReportRepository.persist(officialReport, tx);
    });
  }

  findPresentationPlanAgendas(query: { ignorePlanId: string | undefined }): Promise<FoundAgendasDto> {
    return this.agendaFinder.findNonIncludedInPresentationPlan(query);
  }

  detailsPresentationPlanMetadata(query: { id: string }): Promise<DetailedPresentationPlanMetadataDto> {
    return this.detailsPresentationPlanMetadataQuery.handle(query);
  }

  async createPresentationPlan(command: {
    date: DateOnlyJson;
    time: TimeOnly;
    authorId: string;
    chairmanId: string;
    secretaryId: string;
    justiceContactId: string;
    hasRenunciation: boolean;
    agendas: { id: string; comment: string | null }[];
    absentMembers: readonly string[];
  }): Promise<{ id: string }> {
    return this.prisma.$transaction(async (tx) => {
      const commentByAgendaId = new Map(command.agendas.map((a) => [a.id, a] as const));
      const agendaIds = new Set(commentByAgendaId.keys());
      const { items } = await this.agendaFinder.findNonIncludedInPresentationPlan({ ids: agendaIds, tx });

      if (items.length !== agendaIds.size) throw new NotFoundException();

      const agendas = items.map((item) => {
        const found = commentByAgendaId.get(item.id);
        return { ...item, comment: found?.comment?.trim() || null };
      });

      const { formation } = assertIsDefined(agendas[0]);
      const members = await this.members.internalFindMembersByFormation({
        formation,
        tx,
      });

      const [[chairman], allMembers] = partition(members, (m) => m.id === command.chairmanId);
      if (!chairman) {
        this.logger.error(`unknown chairman id ${command.chairmanId}`);
        throw new NotFoundException();
      }

      const absentMembersSet = new Set(command.absentMembers);
      const planMembers = allMembers.map((member) => ({
        id: member.id,
        isAbsent: absentMembersSet.has(member.id),
      }));

      const secretary = await this.auth.detailsUser({
        userId: command.secretaryId,
        impersonationId: undefined,
        tx,
      });

      const plan = JusticePresentationPlan.create({
        agendas,
        chairman,
        // oxlint-disable-next-line typescript/no-misused-spread
        secretary: { ...secretary, id: secretary.userId },
        justiceContactId: command.justiceContactId,
        authorId: command.authorId,
        time: command.time,
        hasRenunciation: command.hasRenunciation,
        date: DateOnly.fromJson(command.date),
        members: planMembers,
      });

      await this.justicePresentationPlanRepository.persist(plan, tx);

      return { id: plan.id };
    });
  }

  async updatePresentationPlan(command: {
    id: string;
    date: DateOnlyJson;
    time: TimeOnly;
    endingTime: TimeOnly | null;
    authorId: string;
    chairmanId: string;
    secretaryId: string;
    justiceContactId: string;
    hasRenunciation: boolean;
    agendas: { id: string; comment: string | null }[];
    absentMembers: readonly string[];
  }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const plan = await this.justicePresentationPlanRepository.find({
        tx,
        id: command.id,
      });

      const commentByAgendaId = new Map(command.agendas.map((a) => [a.id, a] as const));
      const agendaIds = new Set(commentByAgendaId.keys());
      const { items } = await this.agendaFinder.findNonIncludedInPresentationPlan({
        tx,
        ids: agendaIds,
        ignorePlanId: command.id,
      });

      if (items.length !== agendaIds.size) throw new NotFoundException();

      const agendas = items.map((item) => {
        const found = commentByAgendaId.get(item.id);
        return { ...item, comment: found?.comment || null };
      });

      const { formation } = assertIsDefined(agendas[0]);
      const members = await this.members.internalFindMembersByFormation({
        formation,
        tx,
      });

      const [[chairman], allMembers] = partition(members, (m) => m.id === command.chairmanId);

      if (!chairman) {
        this.logger.error(`unknown chairman id ${command.chairmanId}`);
        throw new NotFoundException();
      }

      const absentMembersSet = new Set(command.absentMembers);
      const planMembers = allMembers.map((m) => ({ id: m.id, isAbsent: absentMembersSet.has(m.id) }));

      const secretary = await this.auth.detailsUser({
        tx,
        userId: command.secretaryId,
        impersonationId: undefined,
      });

      plan.update({
        agendas,
        chairman,
        hasRenunciation: command.hasRenunciation,
        // oxlint-disable-next-line typescript/no-misused-spread
        secretary: { ...secretary, id: secretary.userId },
        justiceContactId: command.justiceContactId,
        authorId: command.authorId,
        time: command.time,
        endingTime: command.endingTime,
        date: DateOnly.fromJson(command.date),
        members: planMembers,
      });

      await this.justicePresentationPlanRepository.persist(plan, tx);
    });
  }

  async deletePresentationPlan(command: { id: string }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const plan = await this.justicePresentationPlanRepository.find({
        id: command.id,
        tx,
      });

      plan.delete();

      await this.justicePresentationPlanRepository.persist(plan, tx);
    });
  }

  findPresentationPlanDocument(query: { id: string; forceNew?: boolean }): Promise<string> {
    return this.findPresentationPlanDocumentQuery.handle(query);
  }

  findPresentationPlanDocumentPdf(query: { id: string; forceNew?: boolean }): Promise<StreamableFile> {
    return this.findPresentationPlanDocumentPdfQuery.handle(query);
  }

  listNonPresentedPlans(): Promise<ListedNonPresentedPlansDto> {
    return this.listNonPresentedPlansQuery.handle();
  }

  listPresentedPlans(query: { pagination: Pagination }): Promise<ListedPresentedPlansDto> {
    return this.listPresentedPlansQuery.handle(query);
  }

  async presentPlan(command: { id: string; endTime: TimeOnly }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const plan = await this.justicePresentationPlanRepository.find({
        tx,
        id: command.id,
      });
      plan.present({ endTime: command.endTime });
      await this.justicePresentationPlanRepository.persist(plan, tx);

      const htmlPlan = await tx.justicePresentationPlan.findUnique({
        where: { id: command.id },
        select: { html: true },
      });

      if (!htmlPlan || !htmlPlan.html) {
        this.logger.error(`tried updating the template of unknown plan`);
        throw new InternalServerErrorException();
      }

      const updatedHtml = updatePresentationTimeDocMeetingSessionEndingTime({
        html: htmlPlan.html,
        meetingSessionEndingTime: command.endTime,
      });

      await tx.justicePresentationPlan.update({
        where: { id: command.id },
        data: { html: updatedHtml, pdfId: null },
      });
    });

    await this.findPresentationPlanDocumentPdf({ id: command.id });
  }

  async unPresentPlan(command: { id: string }): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const plan = await this.justicePresentationPlanRepository.find({
        tx,
        id: command.id,
      });
      plan.unPresent();
      await this.justicePresentationPlanRepository.persist(plan, tx);
    });
  }

  async detailsPresentationPlanPdfDocument(query: { id: string }): Promise<{ id: string; url: string }> {
    return this.detailsPresentationPlanPdfDocumentQuery.handle(query);
  }

  internalFindNominationFilesLinkedDocs(query: {
    tx?: Prisma.TransactionClient;
    nominationFileIds: Set<string>;
  }): Promise<InternalFoundNominationFilesLinkedDocsDto> {
    return this.internalFindNominationFileLinkedDocsQuery.handle(query);
  }

  detailsAgendaFiles(query: { agendaId: string }): Promise<DetailedAgendaFilesDto> {
    return this.detailsAgendaFilesQuery.handle(query);
  }
}
