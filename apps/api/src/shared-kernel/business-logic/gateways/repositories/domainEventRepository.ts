import { DomainEvent } from '../../models/domainEvent';
import { TransactionableAsync } from '../providers/transactionPerformer';

export interface DomainEventRepository {
  save(domainEvent: DomainEvent): TransactionableAsync;
  retrieveNewEvents(): TransactionableAsync<DomainEvent[]>;
  markEventAsConsumed(id: string): TransactionableAsync;
}
