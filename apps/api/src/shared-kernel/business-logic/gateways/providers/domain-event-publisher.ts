import { DomainEvent } from '../../models/domain-event';

export interface DomainEventPublisher {
  publish(domainEvent: DomainEvent): Promise<void>;
}
