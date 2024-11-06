import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import {
  DomainEvent,
  DomainEventStatus,
} from 'src/shared-kernel/business-logic/models/domainEvent';
import { clearDB } from 'test/docker-postgresql-manager';
import { DrizzleTransactionPerformer } from '../../providers/drizzle-transaction-performer';
import { drizzleConfigForTest } from './config/drizzle-config';
import { DrizzleDb, getDrizzleInstance } from './config/drizzle-instance';
import { domainEvents } from './schema';
import { SqlDomainEventRepository } from './sql-domain-event-repository';

describe('SQL Domain Event Repository', () => {
  let db: DrizzleDb;
  let sqlDomainEventRepository: SqlDomainEventRepository;
  let transactionPerformer: TransactionPerformer;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);
    sqlDomainEventRepository = new SqlDomainEventRepository();
    transactionPerformer = new DrizzleTransactionPerformer(db);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('saves a domain event', async () => {
    await transactionPerformer.perform(
      sqlDomainEventRepository.save(aNewDomainEvent),
    );
    expectDomainEventsPm(aNewDomainEvent);
  });

  describe('when there are domain events in the database', () => {
    beforeEach(async () => {
      await givenDomainEvents(aNewDomainEventPm, aConsumedDomainEventPm);
    });

    it("retrieves the domain events that haven't been consumed", async () => {
      const newEvents = await transactionPerformer.perform(
        sqlDomainEventRepository.retrieveNewEvents(),
      );
      expect(newEvents).toEqual([aNewDomainEvent]);
    });

    it('marks an event as consumed', async () => {
      await transactionPerformer.perform(
        sqlDomainEventRepository.markEventAsConsumed(aNewDomainEvent.id),
      );
      await expectDomainEventsPm(
        { ...aNewDomainEvent, status: DomainEventStatus.CONSUMED },
        aConsumedDomainEventPm,
      );
    });
  });

  const givenDomainEvents = async (
    ...events: (typeof domainEvents.$inferInsert)[]
  ) => {
    for (const event of events)
      await db.insert(domainEvents).values(event).execute();
  };

  const expectDomainEventsPm = async (
    ...events: (typeof domainEvents.$inferInsert)[]
  ) => {
    const domainEventsInDb = await db.select().from(domainEvents).execute();
    expect(domainEventsInDb).toHaveLength(events.length);
    expect(domainEventsInDb).toEqual(expect.arrayContaining(events));
  };
});

class TestDomainEvent extends DomainEvent {}

const aNewDomainEventPm = {
  id: 'cd1619e2-263d-49b6-b928-6a04ee681133',
  type: 'NEW_EVENT',
  payload: { someKey: 'some new value' },
  occurredOn: new Date(2030, 10, 10),
  status: DomainEventStatus.NEW,
} satisfies typeof domainEvents.$inferInsert;
const aNewDomainEvent = new TestDomainEvent(
  aNewDomainEventPm.id,
  aNewDomainEventPm.type,
  aNewDomainEventPm.payload,
  aNewDomainEventPm.occurredOn,
  aNewDomainEventPm.status,
);

const aConsumedDomainEventPm = {
  id: '4f38e3d4-e23a-446e-9c17-8b2bcf03f358',
  type: 'CONSUMED_EVENT',
  payload: { someKey: 'some consumed value' },
  occurredOn: new Date(2030, 1, 1),
  status: DomainEventStatus.CONSUMED,
} satisfies typeof domainEvents.$inferInsert;
