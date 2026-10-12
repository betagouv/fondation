import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { JusticePresentationPlanContent } from '../../domain/justice-presentation-plan-content';
import { JusticePresentationPlanRepository } from '../repositories/justice-presentation-plan.repository';
import { Prisma } from 'src/generated/prisma/client';
import { DocInvalidation } from 'src/modules/docs/shared/domain/invalidation/official-report-invalidated.integration-event';
import { DocsNominationFilesFinder } from 'src/modules/docs/shared/infrastructure/finders/docs-nomination-files.finder';
import { Db } from 'src/modules/framework/database';
import { assertNever } from 'src/utils/assert-never';
import { isDefined } from 'src/utils/is-defined';

@Injectable()
export class InternalInvalidatePresentationPlanUseCase {
  constructor(
    private readonly db: Db,
    private readonly docsNominationFilesFinder: DocsNominationFilesFinder,
    private readonly justicePresentationPlanRepository: JusticePresentationPlanRepository,
  ) {}

  @Transactional()
  async handle(invalidation: DocInvalidation): Promise<void> {
    switch (invalidation.type) {
      case 'AgendaNominationFilesUpdated':
      case 'AgendaValidated':
        return this.checkContentOf(await this.planIdsOfAgenda(invalidation.payload.agendaId));

      case 'NominationFileOutcomeUpdated':
        return this.checkContentOf(await this.planIdsOfNominationFile(invalidation.payload.nominationFileId));

      case 'AgendaDateUpdated':
      case 'AgendaFileBlockEdited':
      case 'SessionAffectationVersionPublished':
      case 'SessionDateUpdated':
        return;

      default:
        return assertNever(invalidation);
    }
  }

  private async planIdsOfAgenda(agendaId: string): Promise<string[]> {
    const links = await this.db.tx.justicePresentationPlanToAgenda.findMany({
      where: { agendaId },
      select: { planId: true } satisfies Prisma.JusticePresentationPlanToAgendaSelect,
    });

    return links.map(({ planId }) => planId);
  }

  private async planIdsOfNominationFile(nominationFileId: string): Promise<string[]> {
    const files = await this.db.tx.justicePresentationPlanNominationFile.findMany({
      where: { nominationFileId },
      distinct: ['planId'],
      select: { planId: true } satisfies Prisma.JusticePresentationPlanNominationFileSelect,
    });

    return files.map(({ planId }) => planId);
  }

  private async checkContentOf(planIds: readonly string[]): Promise<void> {
    for (const planId of planIds) {
      const plan = await this.justicePresentationPlanRepository.find({ id: planId });
      const { items } = await this.docsNominationFilesFinder.findByAgendaIds({
        agendaIds: new Set(plan.agendaIds),
      });

      plan.checkContent({
        current: JusticePresentationPlanContent.from(
          items.flatMap((file) =>
            isDefined(file.outcome)
              ? [
                  {
                    name: file.magistrat.name,
                    nominationFileId: file.id,
                    number: file.number,
                    outcome: file.outcome.value,
                    outcomeComment: file.outcome.comment,
                    targetedGrade: file.targetPosition.grade,
                    targetedPosition: file.targetPosition.label,
                  },
                ]
              : [],
          ),
        ),
      });

      await this.justicePresentationPlanRepository.persist(plan);
    }
  }
}
