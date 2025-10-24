import { eq } from 'drizzle-orm';
import { DomainEventRepository } from 'src/shared-kernel/business-logic/gateways/repositories/domain-event.repository';
import {
  DomainEvent,
  DomainEventStatus,
} from 'src/shared-kernel/business-logic/models/domain-event';
import { DrizzleTransactionableAsync } from '../../providers/drizzle-transaction-performer';
import { domainEvents, toDomainEventStatus } from './schema';

export class SqlDomainEventRepository implements DomainEventRepository {
  save(domainEvent: DomainEvent): DrizzleTransactionableAsync {
    return async (trx) => {
      await trx
        .insert(domainEvents)
        .values(SqlDomainEventRepository.mapToDb(domainEvent))
        .execute();
    };
  }
  retrieveNewEvents(): DrizzleTransactionableAsync<DomainEvent[]> {
    return async (trx) => {
      const domainEventsPm = await trx
        .select()
        .from(domainEvents)
        .where(eq(domainEvents.status, DomainEventStatus.NEW))
        .execute();
      return domainEventsPm.map(this.mapToDomain);
    };
  }
  markEventAsConsumed(id: string): DrizzleTransactionableAsync {
    return async (trx) => {
      await trx
        .update(domainEvents)
        .set({ status: DomainEventStatus.CONSUMED })
        .where(eq(domainEvents.id, id));
    };
  }

  static mapToDb(domainEvent: DomainEvent): typeof domainEvents.$inferInsert {
    return {
      id: domainEvent.id,
      type: domainEvent.type,
      payload: domainEvent.payload,
      occurredOn: domainEvent.occurredOn,
      status: domainEvent.status,
    };
  }

  private mapToDomain(
    domainEventPm: typeof domainEvents.$inferSelect,
  ): DomainEvent {
    return new DomainEvent(
      domainEventPm.id,
      domainEventPm.type,
      domainEventPm.payload,
      domainEventPm.occurredOn,
      toDomainEventStatus(domainEventPm.status),
    );
  }
}
