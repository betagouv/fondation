import { DomainEventsPoller } from 'src/shared-kernel/adapters/primary/nestjs/domain-event-poller';
import { FakeDomainEventPublisher } from 'src/shared-kernel/adapters/secondary/gateways/providers/fake-domain-event-publisher';
import { NullTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/null-transaction-performer';
import { FakeDomainEventRepository } from 'src/shared-kernel/adapters/secondary/gateways/repositories/fake-domain-event-repository';
import {
  DomainEvent,
  DomainEventStatus,
} from 'src/shared-kernel/business-logic/models/domain-event';

describe('Domain Event Poller', () => {
  let domainEventRepository: FakeDomainEventRepository;
  let domainEventPublisher: FakeDomainEventPublisher;

  beforeEach(() => {
    domainEventPublisher = new FakeDomainEventPublisher();
    domainEventRepository = new FakeDomainEventRepository();
    domainEventRepository.events = [anEvent];
  });

  it('publishes an event', async () => {
    await pollEvents();
    expect(domainEventPublisher.getPublishedEvents()).toEqual([aConsumedEvent]);
  });

  it('marks an event as consumed', async () => {
    await pollEvents();
    expect(domainEventRepository).toHaveDomainEvents(aConsumedEvent);
  });

  const pollEvents = () =>
    new DomainEventsPoller(
      domainEventRepository,
      domainEventPublisher,
      new NullTransactionPerformer(),
    ).execute();
});

class FakeEvent extends DomainEvent<string> {}

const currentDate = new Date();
const anEvent = new FakeEvent(
  'fake-event-id',
  'payload',
  'event-name',
  currentDate,
);
const aConsumedEvent = new FakeEvent(
  'fake-event-id',
  'payload',
  'event-name',
  currentDate,
  DomainEventStatus.CONSUMED,
);
