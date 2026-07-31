import { Transactional } from '@nestjs-cls/transactional';
import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';

import { Db } from '../../framework/database';
import { Pagination } from '../../framework/pagination';
import { MembersService } from '../../members';
import { SimpleAuthService } from '../../simple-auth';
import { AgendaFinder, FoundAgendasDto } from '../shared/infrastructure/finders/agenda.finder';
import { Files } from 'src/modules/framework/files';
import { DateOnly, DateOnlyJson } from 'src/utils/date-only';
import { assertIsDefined } from 'src/utils/is-defined';
import { partition } from 'src/utils/iterables';
import { TimeOnly } from 'src/utils/time-only';

import { JusticePresentationPlan } from './domain/justice-presentation-plan';
import {
  DetailedPresentationPlanMetadataDto,
  DetailsPresentationPlanMetadataQuery,
} from './infrastructure/queries/details-presentation-plan-metadata.query';
import { DetailsPresentationPlanPdfDocumentQuery } from './infrastructure/queries/details-presentation-plan-pdf-document.query';
import { FindPresentationPlanDocumentPdfQuery } from './infrastructure/queries/find-presentation-plan-document-pdf.query';
import { FindPresentationPlanDocumentQuery } from './infrastructure/queries/find-presentation-plan-document.query';
import {
  ListedNonPresentedPlansDto,
  ListNonPresentedPlansQuery,
} from './infrastructure/queries/list-non-presented-plans.query';
import {
  ListedPresentedPlansDto,
  ListPresentedPlansQuery,
} from './infrastructure/queries/list-presented-plans.query';
import { JusticePresentationPlanRepository } from './infrastructure/repositories/justice-presentation-plan.repository';
import { updatePresentationTimeDocMeetingSessionEndingTime } from './infrastructure/services/renderers/presentation-plan.html';

@Injectable()
export class PresentationPlansService {
  private readonly logger = new Logger(PresentationPlansService.name);

  constructor(
    private readonly files: Files,
    private readonly agendaFinder: AgendaFinder,
    private readonly detailsPresentationPlanMetadataQuery: DetailsPresentationPlanMetadataQuery,
    private readonly detailsPresentationPlanPdfDocumentQuery: DetailsPresentationPlanPdfDocumentQuery,
    private readonly findPresentationPlanDocumentPdfQuery: FindPresentationPlanDocumentPdfQuery,
    private readonly findPresentationPlanDocumentQuery: FindPresentationPlanDocumentQuery,
    private readonly justicePresentationPlanRepository: JusticePresentationPlanRepository,
    private readonly listNonPresentedPlansQuery: ListNonPresentedPlansQuery,
    private readonly listPresentedPlansQuery: ListPresentedPlansQuery,
    private readonly auth: SimpleAuthService,
    private readonly db: Db,

    @Inject(forwardRef(() => MembersService))
    private readonly members: MembersService,
  ) {}

  findPresentationPlanAgendas(query: { ignorePlanId: string | undefined }): Promise<FoundAgendasDto> {
    return this.agendaFinder.findNonIncludedInPresentationPlan(query);
  }

  detailsPresentationPlanMetadata(query: { id: string }): Promise<DetailedPresentationPlanMetadataDto> {
    return this.detailsPresentationPlanMetadataQuery.handle(query);
  }

  @Transactional()
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
    const commentByAgendaId = new Map(command.agendas.map((a) => [a.id, a] as const));
    const agendaIds = new Set(commentByAgendaId.keys());
    const { items } = await this.agendaFinder.findNonIncludedInPresentationPlan({ ids: agendaIds });

    if (items.length !== agendaIds.size) throw new NotFoundException();

    const agendas = items.map((item) => {
      const found = commentByAgendaId.get(item.id);
      return { ...item, comment: found?.comment?.trim() || null };
    });

    const { formation } = assertIsDefined(agendas[0]);
    const members = await this.members.internalFindMembersByFormation({
      formation,
      tx: this.db.tx,
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
      tx: this.db.tx,
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

    await this.justicePresentationPlanRepository.persist(plan);

    return { id: plan.id };
  }

  @Transactional()
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
    const plan = await this.justicePresentationPlanRepository.find({ id: command.id });

    const commentByAgendaId = new Map(command.agendas.map((a) => [a.id, a] as const));
    const agendaIds = new Set(commentByAgendaId.keys());
    const { items } = await this.agendaFinder.findNonIncludedInPresentationPlan({
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
      tx: this.db.tx,
    });

    const [[chairman], allMembers] = partition(members, (m) => m.id === command.chairmanId);

    if (!chairman) {
      this.logger.error(`unknown chairman id ${command.chairmanId}`);
      throw new NotFoundException();
    }

    const absentMembersSet = new Set(command.absentMembers);
    const planMembers = allMembers.map((m) => ({ id: m.id, isAbsent: absentMembersSet.has(m.id) }));

    const secretary = await this.auth.detailsUser({
      tx: this.db.tx,
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

    await this.justicePresentationPlanRepository.persist(plan);
  }

  @Transactional()
  async deletePresentationPlan(command: { id: string }): Promise<void> {
    const plan = await this.justicePresentationPlanRepository.find({ id: command.id });

    plan.delete();

    await this.justicePresentationPlanRepository.persist(plan);
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
    await this.db.withTransaction(async () => {
      const plan = await this.justicePresentationPlanRepository.find({ id: command.id });
      plan.present({ endTime: command.endTime });
      await this.justicePresentationPlanRepository.persist(plan);

      const htmlPlan = await this.db.tx.justicePresentationPlan.findUnique({
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

      await this.db.tx.justicePresentationPlan.update({
        where: { id: command.id },
        data: { html: updatedHtml, pdfId: null },
      });
    });

    await this.findPresentationPlanDocumentPdf({ id: command.id });
  }

  @Transactional()
  async unPresentPlan(command: { id: string }): Promise<void> {
    const plan = await this.justicePresentationPlanRepository.find({ id: command.id });
    plan.unPresent();
    await this.justicePresentationPlanRepository.persist(plan);
  }

  async detailsPresentationPlanPdfDocument(query: { id: string }): Promise<{ id: string; url: string }> {
    return this.detailsPresentationPlanPdfDocumentQuery.handle(query);
  }

  async resetPresentationPlanDocument(command: { id: string }): Promise<void> {
    const plan = await this.db.tx.justicePresentationPlan.findUnique({
      where: { id: command.id },
      select: { pdf: { select: { id: true, path: true } } },
    });
    if (!plan) throw new NotFoundException();

    await this.db.tx.justicePresentationPlan.update({
      where: { id: command.id },
      data: { html: null, isManuallyEdited: false, pdfId: null },
    });

    if (plan.pdf) this.files.delete([plan.pdf]);
  }

  async updatePresentationPlanHtml(command: { id: string; html: Buffer }): Promise<void> {
    await this.db.tx.justicePresentationPlan.update({
      where: { id: command.id },
      data: { html: command.html.toString('utf-8'), isManuallyEdited: true },
    });
  }
}
