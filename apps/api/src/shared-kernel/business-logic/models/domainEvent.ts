export type DomainEventStatus = 'NEW' | 'PENDING' | 'CONSUMED';

export abstract class DomainEvent<T = unknown> {
  constructor(
    public readonly id: string,
    public readonly type: string,
    public readonly payload: T,
    public readonly occurredOn: Date,
    public status: DomainEventStatus = 'NEW',
  ) {}

  markAsConsumed() {
    this.status = 'CONSUMED';
  }
}
