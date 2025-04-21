import { DomainEventPublisher } from 'src/shared-kernel/business-logic/gateways/providers/domain-event-publisher';
import { DomainEvent } from 'src/shared-kernel/business-logic/models/domain-event';

export class FakeDomainEventPublisher implements DomainEventPublisher {
  private events: DomainEvent[] = [];

  async publish(event: DomainEvent): Promise<void> {
    this.events.push(event);
  }

  getPublishedEvents(): DomainEvent[] {
    return this.events;
  }
}
