import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  RapportTransparenceCrééEvent,
  RapportTransparenceCrééEventPayload,
} from 'src/reports-context/business-logic/models/events/rapport-transparence-créé.event';
import { RapportTransparenceCrééSubscriber } from 'src/reports-context/business-logic/listeners/rapport-transparence-crée.subscriber';

@Injectable()
export class RapportTransparenceCrééNestSubscriber {
  constructor(
    private readonly rapportTransparenceCrééSubscriber: RapportTransparenceCrééSubscriber,
  ) {}

  @OnEvent(RapportTransparenceCrééEvent.name)
  async handleRapportTransparenceCrééEvent(
    payload: RapportTransparenceCrééEventPayload,
  ): Promise<void> {
    await this.rapportTransparenceCrééSubscriber.handle(payload);
  }
}
