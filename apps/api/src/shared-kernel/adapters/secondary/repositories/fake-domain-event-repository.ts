import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { DomainEventRepository } from 'src/shared-kernel/business-logic/gateways/repositories/domainEventRepository';
import { DomainEvent } from 'src/shared-kernel/business-logic/models/domainEvent';

export class FakeDomainEventRepository implements DomainEventRepository {
  events: DomainEvent[] = [];

  save<T>(event: DomainEvent<T>): TransactionableAsync {
    return async () => {
      this.events.push(event);
    };
  }

  async retrieveNewEvents(): Promise<DomainEvent[]> {
    return this.events.filter((e) => e.status === 'NEW');
  }

  markEventAsConsumed(id: string): TransactionableAsync {
    return async () => {
      const event = this.events.find((e) => e.id === id);
      if (event) event.markAsConsumed();
    };
  }
}
