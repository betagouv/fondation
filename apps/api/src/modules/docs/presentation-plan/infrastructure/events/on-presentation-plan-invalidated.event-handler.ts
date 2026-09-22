import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { PresentationPlansService } from '../../presentation-plans.service';
import { DocInvalidatedIntegrationEvent } from 'src/modules/docs/shared/domain/invalidation/official-report-invalidated.integration-event';

@Injectable()
export class OnPresentationPlanInvalidatedEventHandler {
  constructor(private readonly presentationPlans: PresentationPlansService) {}

  @OnEvent(DocInvalidatedIntegrationEvent.name, { promisify: true })
  async handle(event: DocInvalidatedIntegrationEvent): Promise<void> {
    await this.presentationPlans.internalInvalidatePresentationPlan(event.cause);
  }
}
