import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { DocInvalidation } from '../../domain/doc-invalidation';
import { InvalidateAgendasUseCase } from 'src/modules/docs/agenda/infrastructure/use-cases/invalidate-agenda.use-case';
import { InvalidateOfficialReportUseCase } from 'src/modules/docs/official-report/infrastructure/use-cases/invalidate-official-report.use-case';
import { InvalidatePresentationPlanUseCase } from 'src/modules/docs/presentation-plan/infrastructure/use-cases/invalidate-presentation-plan.use-case';

@Injectable()
export class InvalidateDocsUseCase {
  constructor(
    private readonly invalidateAgendas: InvalidateAgendasUseCase,
    private readonly invalidateOfficialReport: InvalidateOfficialReportUseCase,
    private readonly invalidatePresentationPlan: InvalidatePresentationPlanUseCase,
  ) {}

  @Transactional(Propagation.Mandatory)
  async handle(invalidations: readonly DocInvalidation[]): Promise<void> {
    for (const invalidation of invalidations) {
      await this.invalidateAgendas.handle(invalidation);
      await this.invalidateOfficialReport.handle(invalidation);
      await this.invalidatePresentationPlan.handle(invalidation);
    }
  }
}
