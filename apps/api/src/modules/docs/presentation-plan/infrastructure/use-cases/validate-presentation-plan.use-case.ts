import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';

import { JusticePresentationPlanChangedWhileValidated } from '../../domain/justice-presentation-plan';
import { FindPresentationPlanDocumentPdfQuery } from '../queries/find-presentation-plan-document-pdf.query';
import { JusticePresentationPlanRepository } from '../repositories/justice-presentation-plan.repository';
import { Prisma } from 'src/generated/prisma/client';
import { lockAgendasRawQuery } from 'src/generated/prisma/sql';
import { Db } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';

@Injectable()
export class ValidatePresentationPlanUseCase {
  constructor(
    private readonly db: Db,
    private readonly files: Files,
    private readonly findPresentationPlanDocumentPdfQuery: FindPresentationPlanDocumentPdfQuery,
    private readonly justicePresentationPlanRepository: JusticePresentationPlanRepository,
  ) {}

  // rendering and uploading the pdf stay out of the transaction: they would hold a connection for seconds
  async handle(command: { id: string; validatorId: string }): Promise<void> {
    const plan = await this.db.tx.justicePresentationPlan.findUnique({
      where: { id: command.id },
      select: {
        pdfId: true,
        agendas: { select: { agendaId: true } },
      } satisfies Prisma.JusticePresentationPlanSelect,
    });
    if (!plan) throw new NotFoundException();
    if (plan.pdfId) return;

    const agendaIds = plan.agendas.map(({ agendaId }) => agendaId);
    const { html, pdf } = await this.findPresentationPlanDocumentPdfQuery.render({ id: command.id });

    await this.settle({ ...command, agendaIds, html, pdfId: pdf.id }).catch((error: unknown) => {
      this.files.delete([pdf]);
      throw error;
    });
  }

  /** two notices validated at once with a shared agenda would each take it from the other */
  @Transactional()
  private async settle(command: {
    agendaIds: string[];
    html: string;
    id: string;
    pdfId: string;
    validatorId: string;
  }): Promise<void> {
    await this.db.tx.$queryRawTyped(lockAgendasRawQuery(command.agendaIds));

    // another validation may have taken an agenda meanwhile, even from a text edited by hand that still reads it
    const stored = await this.db.tx.justicePresentationPlan.findUnique({
      where: { id: command.id },
      select: {
        html: true,
        agendas: { select: { agendaId: true } },
      } satisfies Prisma.JusticePresentationPlanSelect,
    });
    const agendaIds = new Set(stored?.agendas.map(({ agendaId }) => agendaId));
    if (stored?.html !== command.html || agendaIds.symmetricDifference(new Set(command.agendaIds)).size > 0) {
      throw new JusticePresentationPlanChangedWhileValidated();
    }

    await this.db.tx.justicePresentationPlan.update({
      where: { id: command.id },
      data: { pdfId: command.pdfId },
    });
    await this.db.tx.justicePresentationPlanRemovedAgenda.deleteMany({ where: { planId: command.id } });

    const drafts = await this.db.tx.justicePresentationPlanToAgenda.findMany({
      where: { agendaId: { in: command.agendaIds }, planId: { not: command.id } },
      distinct: ['planId'],
      select: { planId: true } satisfies Prisma.JusticePresentationPlanToAgendaSelect,
    });

    for (const { planId } of drafts) {
      const draft = await this.justicePresentationPlanRepository.find({ id: planId });
      draft.removeAgendas({
        agendaIds: command.agendaIds,
        removerId: command.validatorId,
        takenByPlanId: command.id,
      });
      await this.justicePresentationPlanRepository.persist(draft);
    }
  }
}
