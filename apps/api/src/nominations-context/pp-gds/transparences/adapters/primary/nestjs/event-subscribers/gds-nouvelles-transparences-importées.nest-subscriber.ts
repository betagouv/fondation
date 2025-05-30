import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  GdsNewTransparenceImportedEvent,
  GdsNewTransparenceImportedEventPayload,
} from 'src/data-administration-context/transparence-tsv/business-logic/models/events/gds-transparence-imported.event';
import { GdsNouvellesTransparencesImportéesSubscriber } from 'src/nominations-context/pp-gds/transparences/business-logic/listeners/gds-nouvelles-transparences-importées.subscriber';

@Injectable()
export class GdsNouvellesTransparencesImportéesNestSubscriber {
  constructor(
    private readonly subscriber: GdsNouvellesTransparencesImportéesSubscriber,
  ) {}

  @OnEvent(GdsNewTransparenceImportedEvent.name)
  async handle(payload: GdsNewTransparenceImportedEventPayload): Promise<void> {
    await this.subscriber.handle(payload);
  }
}
