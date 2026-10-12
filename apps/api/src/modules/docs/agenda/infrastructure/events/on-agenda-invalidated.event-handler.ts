import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { AgendasService } from '../../agendas.service';
import { DocInvalidatedIntegrationEvent } from 'src/modules/docs/shared/domain/invalidation/official-report-invalidated.integration-event';

@Injectable()
export class OnAgendaInvalidatedEventHandler {
  constructor(private readonly agendas: AgendasService) {}

  @OnEvent(DocInvalidatedIntegrationEvent.name, { promisify: true })
  async handle(event: DocInvalidatedIntegrationEvent): Promise<void> {
    await this.agendas.internalInvalidateAgendas(event.cause);
  }
}
