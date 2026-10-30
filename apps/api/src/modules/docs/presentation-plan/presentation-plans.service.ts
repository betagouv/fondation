import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client';
import { DateOnly, DateOnlyJson } from '../../../utils/date-only';
import { assertIsDefined } from '../../../utils/is-defined';
import { partition } from '../../../utils/iterables';
import { TimeOnly } from '../../../utils/time-only';
import { Clock } from '../../framework/clock';
import { Db } from '../../framework/database';
import { Files } from '../../framework/files';
import { Pagination } from '../../framework/pagination';
import { MembersService } from '../../members';
import { SimpleAuthService } from '../../simple-auth';
import { AgendaFinder, FoundAgendasDto } from '../shared/infrastructure/finders/agenda.finder';

import {
  JusticePresentationPlan,
  JusticePresentationPlanAlreadyPresented,
} from './domain/justice-presentation-plan';
import { canEditPresentationPlan } from './domain/presentation-plan.policies';
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
import {
  removePresentationTimeDocMeetingSessionEndingTime,
  updatePresentationTimeDocMeetingSessionEndingTime,
  withEditedPresentationPlanContent,
} from './infrastructure/services/renderers/presentation-plan.html';
import { ValidatePresentationPlanUseCase } from './infrastructure/use-cases/validate-presentation-plan.use-case';

@Injectable()
export class PresentationPlansService {
  private readonly logger = new Logger(PresentationPlansService.name);

  constructor(
    private readonly clock: Clock,
    private readonly files: Files,
    private readonly agendaFinder: AgendaFinder,
    private readonly detailsPresentationPlanMetadataQuery: DetailsPresentationPlanMetadataQuery,
    private readonly detailsPresentationPlanPdfDocumentQuery: DetailsPresentationPlanPdfDocumentQuery,
    private readonly findPresentationPlanDocumentPdfQuery: FindPresentationPlanDocumentPdfQuery,
    private readonly findPresentationPlanDocumentQuery: FindPresentationPlanDocumentQuery,
    private readonly justicePresentationPlanRepository: JusticePresentationPlanRepository,
    private readonly listNonPresentedPlansQuery: ListNonPresentedPlansQuery,
    private readonly listPresentedPlansQuery: ListPresentedPlansQuery,
    private readonly validatePresentationPlanUseCase: ValidatePresentationPlanUseCase,
    private readonly auth: SimpleAuthService,
    private readonly db: Db,

    private readonly members: MembersService,
  ) {}

  findPresentationPlanAgendas(query: { ignorePlanId: string | undefined }): Promise<FoundAgendasDto> {
    return this.agendaFinder.findAwaitingPresentationPlan(query);
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
    const { items } = await this.agendaFinder.findAwaitingPresentationPlan({ ids: agendaIds });

    if (items.length !== agendaIds.size) throw new NotFoundException();

    const agendas = items.map((item) => {
      const found = commentByAgendaId.get(item.id);
      return { ...item, comment: found?.comment?.trim() || null };
    });

    const { formation } = assertIsDefined(agendas[0]);
    const members = await this.members.internalFindMembersByFormation({
      formation,
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
      impersonationId: undefined,
      userId: command.secretaryId,
    });

    const plan = JusticePresentationPlan.create({
      agendas,
      authorId: command.authorId,
      chairman,
      date: DateOnly.fromJson(command.date),
      hasRenunciation: command.hasRenunciation,
      justiceContactId: command.justiceContactId,
      members: planMembers,
      // oxlint-disable-next-line typescript/no-misused-spread
      secretary: { ...secretary, id: secretary.userId },
      time: command.time,
    });

    await this.justicePresentationPlanRepository.persist(plan);

    return { id: plan.id };
  }

  @Transactional()
  async updatePresentationPlan(command: {
    id: string;
    date: DateOnlyJson;
    time: TimeOnly;
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
    const { items } = await this.agendaFinder.findAwaitingPresentationPlan({
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
      includeIds: plan.recordedMemberIds,
    });

    const [[chairman], allMembers] = partition(members, (m) => m.id === command.chairmanId);

    if (!chairman) {
      this.logger.error(`unknown chairman id ${command.chairmanId}`);
      throw new NotFoundException();
    }

    const absentMembersSet = new Set(command.absentMembers);
    const planMembers = allMembers.map((m) => ({ id: m.id, isAbsent: absentMembersSet.has(m.id) }));

    const secretary = await this.auth.detailsUser({
      impersonationId: undefined,
      userId: command.secretaryId,
    });

    plan.update({
      agendas,
      authorId: command.authorId,
      chairman,
      date: DateOnly.fromJson(command.date),
      hasRenunciation: command.hasRenunciation,
      justiceContactId: command.justiceContactId,
      members: planMembers,
      // oxlint-disable-next-line typescript/no-misused-spread
      secretary: { ...secretary, id: secretary.userId },
      time: command.time,
    });

    await this.justicePresentationPlanRepository.persist(plan);
  }

  @Transactional()
  async deletePresentationPlan(command: { id: string }): Promise<void> {
    const plan = await this.justicePresentationPlanRepository.find({ id: command.id });

    plan.delete();

    await this.justicePresentationPlanRepository.persist(plan);
  }

  findPresentationPlanDocument(query: { id: string }): Promise<string> {
    return this.findPresentationPlanDocumentQuery.handle(query);
  }

  validatePresentationPlan(command: { id: string; validatorId: string }): Promise<void> {
    return this.validatePresentationPlanUseCase.handle(command);
  }

  listNonPresentedPlans(): Promise<ListedNonPresentedPlansDto> {
    return this.listNonPresentedPlansQuery.handle();
  }

  listPresentedPlans(query: { pagination: Pagination }): Promise<ListedPresentedPlansDto> {
    return this.listPresentedPlansQuery.handle(query);
  }

  async presentPlan(command: { id: string; endTime: TimeOnly; presenterId: string }): Promise<void> {
    await this.db.withTransaction(async () => {
      const plan = await this.justicePresentationPlanRepository.find({ id: command.id });
      plan.present({ endTime: command.endTime, presenterId: command.presenterId });
      await this.justicePresentationPlanRepository.persist(plan);

      const htmlPlan = await this.db.tx.justicePresentationPlan.findUnique({
        select: { html: true } satisfies Prisma.JusticePresentationPlanSelect,
        where: { id: command.id },
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
        data: { html: updatedHtml },
        where: { id: command.id },
      });
    });

    await this.findPresentationPlanDocumentPdfQuery.renew({ id: command.id });
  }

  async unPresentPlan(command: { id: string }): Promise<void> {
    await this.db.withTransaction(async () => {
      const plan = await this.justicePresentationPlanRepository.find({ id: command.id });
      plan.unPresent();
      await this.justicePresentationPlanRepository.persist(plan);

      const { html } = await this.db.tx.justicePresentationPlan.findUniqueOrThrow({
        select: { html: true } satisfies Prisma.JusticePresentationPlanSelect,
        where: { id: command.id },
      });

      await this.db.tx.justicePresentationPlan.update({
        data: {
          html: removePresentationTimeDocMeetingSessionEndingTime({
            html: assertIsDefined(html, 'a presented notice holds the text it was read with'),
          }),
        },
        where: { id: command.id },
      });
    });

    await this.findPresentationPlanDocumentPdfQuery.renew({ id: command.id });
  }

  async detailsPresentationPlanPdfDocument(query: { id: string }): Promise<{ id: string; url: string }> {
    return this.detailsPresentationPlanPdfDocumentQuery.handle(query);
  }

  async resetPresentationPlanDocument(command: { authorId: string; id: string }): Promise<void> {
    const plan = await this.db.tx.justicePresentationPlan.findUnique({
      select: {
        isPresented: true,
        pdf: { select: { id: true, path: true } },
      } satisfies Prisma.JusticePresentationPlanSelect,
      where: { id: command.id },
    });
    if (!plan) throw new NotFoundException();
    if (!canEditPresentationPlan(plan)) throw new JusticePresentationPlanAlreadyPresented();

    await this.db.tx.justicePresentationPlan.update({
      data: {
        html: null,
        isManuallyEdited: false,
        pdfId: null,
        updatedAt: this.clock.now(),
        updatedBy: command.authorId,
      },
      where: { id: command.id },
    });

    if (plan.pdf) this.files.delete([plan.pdf]);
  }

  async updatePresentationPlanHtml(command: { authorId: string; html: Buffer; id: string }): Promise<void> {
    const plan = await this.db.tx.justicePresentationPlan.findUnique({
      select: {
        isPresented: true,
        pdf: { select: { id: true, path: true } },
      } satisfies Prisma.JusticePresentationPlanSelect,
      where: { id: command.id },
    });
    if (!plan) throw new NotFoundException();
    if (!canEditPresentationPlan(plan)) throw new JusticePresentationPlanAlreadyPresented();

    const html = await this.findPresentationPlanDocumentQuery.handle({ forceNew: true, id: command.id });
    await this.db.tx.justicePresentationPlan.update({
      data: {
        html: withEditedPresentationPlanContent({ edited: command.html.toString('utf-8'), html }),
        isManuallyEdited: true,
        pdfId: null,
        updatedAt: this.clock.now(),
        updatedBy: command.authorId,
      },
      where: { id: command.id },
    });

    if (plan.pdf) this.files.delete([plan.pdf]);
  }
}
