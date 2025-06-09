import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  TransparenceXlsxImportéeEvent,
  TransparenceXlsxImportéeEventPayload,
} from 'src/data-administration-context/transparence-xlsx/business-logic/models/events/transparence-xlsx-importée.event';
import { TransparenceXlsxImportéeSubscriber } from 'src/nominations-context/pp-gds/transparences/business-logic/listeners/transparence-xlsx-importée.subscriber';

@Injectable()
export class TransparenceXlsxImportéeNestSubscriber {
  constructor(
    private readonly transparenceXlsxImportéeSubscriber: TransparenceXlsxImportéeSubscriber,
  ) {}

  @OnEvent(TransparenceXlsxImportéeEvent.name)
  async handleTransparenceXlsxImportéeEvent(
    payload: TransparenceXlsxImportéeEventPayload,
  ): Promise<void> {
    await this.transparenceXlsxImportéeSubscriber.handle(payload);
  }
}
