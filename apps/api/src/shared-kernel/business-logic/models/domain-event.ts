export enum DomainEventStatus {
  NEW = 'NEW',
  PENDING = 'PENDING',
  CONSUMED = 'CONSUMED',
}

export abstract class DomainEvent<T = unknown> {
  abstract readonly name: string;

  constructor(
    public readonly id: string,
    public readonly type: string,
    public readonly payload: T,
    public readonly occurredOn: Date,
    public status: DomainEventStatus = DomainEventStatus.NEW,
  ) {}

  markAsConsumed() {
    this.status = DomainEventStatus.CONSUMED;
  }
}
