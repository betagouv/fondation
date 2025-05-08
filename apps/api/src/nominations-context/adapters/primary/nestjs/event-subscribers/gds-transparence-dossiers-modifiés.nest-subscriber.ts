import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  GdsTransparenceNominationFilesModifiedEvent,
  GdsTransparenceNominationFilesModifiedEventPayload,
} from 'src/data-administration-context/business-logic/models/events/gds-transparence-nomination-files-modified.event';
import { GdsTransparenceDossiersModifiésSubscriber } from 'src/nominations-context/business-logic/listeners/gds-transparence-dossiers-modifiés.subscriber';

@Injectable()
export class GdsTransparenceDossiersModifiésNestSubscriber {
  constructor(
    private readonly subscriber: GdsTransparenceDossiersModifiésSubscriber,
  ) {}

  @OnEvent(GdsTransparenceNominationFilesModifiedEvent.name)
  async handle(
    payload: GdsTransparenceNominationFilesModifiedEventPayload,
  ): Promise<void> {
    await this.subscriber.handle(payload);
  }
}
