import { DomainEvent } from '../../models/domain-event';
import { TransactionableAsync } from '../providers/transaction-performer';

export interface DomainEventRepository {
  save(domainEvent: DomainEvent): TransactionableAsync;
  retrieveNewEvents(): TransactionableAsync<DomainEvent[]>;
  markEventAsConsumed(id: string): TransactionableAsync;
}
