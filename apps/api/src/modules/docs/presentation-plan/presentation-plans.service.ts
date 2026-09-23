import { Transactional } from '@nestjs-cls/transactional';
import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { Db } from '../../framework/database';
import { Pagination } from '../../framework/pagination';
import { MembersService } from '../../members';
import { SimpleAuthService } from '../../simple-auth';
import { DocInvalidation } from '../shared/domain/invalidation/official-report-invalidated.integration-event';
import { AgendaFinder, FoundAgendasDto } from '../shared/infrastructure/finders/agenda.finder';
import { Prisma } from 'src/generated/prisma/client';
import { Clock } from 'src/modules/framework/clock';
import { Files } from 'src/modules/framework/files';
import { DateOnly, DateOnlyJson } from 'src/utils/date-only';
import { assertIsDefined } from 'src/utils/is-defined';
import { partition } from 'src/utils/iterables';
import { TimeOnly } from 'src/utils/time-only';

import {
  JusticePresentationPlan,
  JusticePresentationPlanAlreadyPresented,
} from './domain/justice-presentation-plan';
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
import { InternalInvalidatePresentationPlanUseCase } from './infrastructure/use-cases/invalidate-presentation-plan.use-case';
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
    private readonly internalInvalidatePresentationPlanUseCase: InternalInvalidatePresentationPlanUseCase,
    private readonly justicePresentationPlanRepository: JusticePresentationPlanRepository,
    private readonly listNonPresentedPlansQuery: ListNonPresentedPlansQuery,
    private readonly listPresentedPlansQuery: ListPresentedPlansQuery,
    private readonly validatePresentationPlanUseCase: ValidatePresentationPlanUseCase,
    private readonly auth: SimpleAuthService,
    private readonly db: Db,

    @Inject(forwardRef(() => MembersService))
    private readonly members: MembersService,
  ) {}

  findPresentationPlanAgendas(query: { ignorePlanId: string | undefined }): Promise<FoundAgendasDto> {
    return this.agendaFinder.findAwaitingPresentationPlan(query);
  }

  internalInvalidatePresentationPlan(cause: DocInvalidation): Promise<void> {
    return this.internalInvalidatePresentationPlanUseCase.handle(cause);
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
      userId: command.secretaryId,
      impersonationId: undefined,
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
    });

    const [[chairman], allMembers] = partition(members, (m) => m.id === command.chairmanId);

    if (!chairman) {
      this.logger.error(`unknown chairman id ${command.chairmanId}`);
      throw new NotFoundException();
    }

    const absentMembersSet = new Set(command.absentMembers);
    const planMembers = allMembers.map((m) => ({ id: m.id, isAbsent: absentMembersSet.has(m.id) }));

    const secretary = await this.auth.detailsUser({
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
        where: { id: command.id },
        select: { html: true } satisfies Prisma.JusticePresentationPlanSelect,
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
        data: { html: updatedHtml },
      });
    });

    await this.findPresentationPlanDocumentPdfQuery.renew({ id: command.id });
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

  async resetPresentationPlanDocument(command: { authorId: string; id: string }): Promise<void> {
    const plan = await this.db.tx.justicePresentationPlan.findUnique({
      where: { id: command.id },
      select: {
        isPresented: true,
        pdf: { select: { id: true, path: true } },
      } satisfies Prisma.JusticePresentationPlanSelect,
    });
    if (!plan) throw new NotFoundException();
    if (plan.isPresented) throw new JusticePresentationPlanAlreadyPresented();

    await this.db.tx.justicePresentationPlan.update({
      where: { id: command.id },
      data: {
        html: null,
        isManuallyEdited: false,
        pdfId: null,
        updatedAt: this.clock.now(),
        updatedBy: command.authorId,
      },
    });

    if (plan.pdf) this.files.delete([plan.pdf]);
  }

  async updatePresentationPlanHtml(command: { authorId: string; html: Buffer; id: string }): Promise<void> {
    const plan = await this.db.tx.justicePresentationPlan.findUnique({
      where: { id: command.id },
      select: {
        isPresented: true,
        pdf: { select: { id: true, path: true } },
      } satisfies Prisma.JusticePresentationPlanSelect,
    });
    if (!plan) throw new NotFoundException();
    if (plan.isPresented) throw new JusticePresentationPlanAlreadyPresented();

    await this.db.tx.justicePresentationPlan.update({
      where: { id: command.id },
      data: {
        html: command.html.toString('utf-8'),
        isManuallyEdited: true,
        pdfId: null,
        updatedAt: this.clock.now(),
        updatedBy: command.authorId,
      },
    });

    if (plan.pdf) this.files.delete([plan.pdf]);
  }
}
