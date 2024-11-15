import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEventPublisher } from 'src/shared-kernel/business-logic/gateways/providers/domain-event-publisher';
import { DomainEvent } from 'src/shared-kernel/business-logic/models/domain-event';

export class NestDomainEventPublisher implements DomainEventPublisher {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async publish(domainEvent: DomainEvent): Promise<void> {
    this.eventEmitter.emit(domainEvent.type, domainEvent.payload);
  }
}
