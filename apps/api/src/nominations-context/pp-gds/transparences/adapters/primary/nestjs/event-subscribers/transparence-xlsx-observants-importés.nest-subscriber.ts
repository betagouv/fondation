import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  TransparenceXlsxObservantsImportésEvent,
  TransparenceXlsxObservantsImportésEventPayload,
} from 'src/data-administration-context/transparence-xlsx/business-logic/models/events/transparence-xlsx-observants-importés.event';
import { TransparenceXlsxObservantsImportésSubscriber } from 'src/nominations-context/pp-gds/transparences/business-logic/listeners/transparence-xlsx-observants-importés.subscriber';

@Injectable()
export class TransparenceXlsxObservantsImportésNestSubscriber {
  constructor(
    private readonly subscriber: TransparenceXlsxObservantsImportésSubscriber,
  ) {}

  @OnEvent(TransparenceXlsxObservantsImportésEvent.name)
  async handle(
    payload: TransparenceXlsxObservantsImportésEventPayload,
  ): Promise<void> {
    await this.subscriber.handle(payload);
  }
}
