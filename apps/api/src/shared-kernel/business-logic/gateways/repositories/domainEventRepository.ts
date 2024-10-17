import { DomainEvent } from '../../models/domainEvent';
import { TransactionableAsync } from '../providers/transactionPerformer';

export interface DomainEventRepository {
  save(domainEvent: DomainEvent): TransactionableAsync;
  retrieveNewEvents(): Promise<DomainEvent[]>;
  markEventAsConsumed(id: string): TransactionableAsync;
}
