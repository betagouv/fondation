import { DomainEvent } from '../../models/domainEvent';

export interface DomainEventPublisher {
  publish(domainEvent: DomainEvent): Promise<void>;
}
