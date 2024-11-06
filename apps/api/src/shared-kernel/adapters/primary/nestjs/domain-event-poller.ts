import { TransactionPerformer } from '../../../business-logic/gateways/providers/transactionPerformer';
import { DomainEventRepository } from '../../../business-logic/gateways/repositories/domainEventRepository';
import { DomainEventPublisher } from '../../../business-logic/gateways/providers/domainEventPublisher';

export class DomainEventsPoller {
  public constructor(
    private domainEventRepository: DomainEventRepository,
    private domainEventPublisher: DomainEventPublisher,
    private transactionPerformer: TransactionPerformer,
  ) {}

  public execute(): Promise<void> {
    return this.pollEvents();
  }

  private async pollEvents() {
    return this.transactionPerformer.perform(async (trx) => {
      const events = await this.domainEventRepository.retrieveNewEvents()(trx);
      await Promise.all(
        events.map(async (event) => {
          await this.domainEventPublisher.publish(event);
          await this.domainEventRepository.markEventAsConsumed(event.id)(trx);
        }),
      );
    });
  }
}
