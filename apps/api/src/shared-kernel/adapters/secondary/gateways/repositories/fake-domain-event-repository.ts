import { TransactionableAsync } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { DomainEventRepository } from 'src/shared-kernel/business-logic/gateways/repositories/domain-event.repository';
import {
  DomainEvent,
  DomainEventStatus,
} from 'src/shared-kernel/business-logic/models/domain-event';

export class FakeDomainEventRepository implements DomainEventRepository {
  events: DomainEvent[] = [];

  save<T>(event: DomainEvent<T>): TransactionableAsync {
    return async () => {
      this.events.push(event);
    };
  }

  retrieveNewEvents(): TransactionableAsync<DomainEvent[]> {
    return async () =>
      this.events.filter((e) => e.status === DomainEventStatus.NEW);
  }

  markEventAsConsumed(id: string): TransactionableAsync {
    return async () => {
      const event = this.events.find((e) => e.id === id);
      if (event) event.markAsConsumed();
    };
  }
}
