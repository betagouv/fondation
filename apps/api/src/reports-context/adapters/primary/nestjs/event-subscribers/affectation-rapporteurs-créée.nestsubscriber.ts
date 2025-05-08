import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  AffectationRapporteursCréeEvent,
  AffectationRapporteursCréeEventPayload,
} from 'src/nominations-context/business-logic/models/events/affectation-rapporteurs-crée.event';
import { AffectationRapporteursCrééeSubscriber } from 'src/reports-context/business-logic/subscribers/affectation-rapporteurs-créée.subscriber';

@Injectable()
export class AffectationRapporteursCrééeNestSubscriber {
  constructor(
    private readonly subscriber: AffectationRapporteursCrééeSubscriber,
  ) {}

  @OnEvent(AffectationRapporteursCréeEvent.name)
  async handle(payload: AffectationRapporteursCréeEventPayload): Promise<void> {
    await this.subscriber.handle(payload);
  }
}
