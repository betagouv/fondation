import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  GdsTransparenceNominationFilesAddedEvent,
  GdsTransparenceNominationFilesAddedEventPayload,
} from 'src/data-administration-context/transparence-tsv/business-logic/models/events/gds-transparence-nomination-files-added.event';
import { GdsTransparenceNouveauxDossiersSubscriber } from 'src/nominations-context/pp-gds/transparences/business-logic/listeners/gds-transparence-nouveaux-dossiers.subscriber';

@Injectable()
export class GdsTransparenceNouveauxDossiersNestSubscriber {
  constructor(
    private readonly subscriber: GdsTransparenceNouveauxDossiersSubscriber,
  ) {}

  @OnEvent(GdsTransparenceNominationFilesAddedEvent.name)
  async handle(
    payload: GdsTransparenceNominationFilesAddedEventPayload,
  ): Promise<void> {
    await this.subscriber.handle(payload);
  }
}
