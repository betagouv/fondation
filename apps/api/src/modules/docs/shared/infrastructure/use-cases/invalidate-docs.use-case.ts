import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { InvalidateAgendasUseCase } from '../../../agenda/infrastructure/use-cases/invalidate-agenda.use-case';
import { InvalidateOfficialReportUseCase } from '../../../official-report/infrastructure/use-cases/invalidate-official-report.use-case';
import { InvalidatePresentationPlanUseCase } from '../../../presentation-plan/infrastructure/use-cases/invalidate-presentation-plan.use-case';
import { DocInvalidation } from '../../domain/doc-invalidation';

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
