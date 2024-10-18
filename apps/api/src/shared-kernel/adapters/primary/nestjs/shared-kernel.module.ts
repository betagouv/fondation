import { Module } from '@nestjs/common';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { DomainEventPublisher } from 'src/shared-kernel/business-logic/gateways/providers/domainEventPublisher';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { DomainEventRepository } from 'src/shared-kernel/business-logic/gateways/repositories/domainEventRepository';
import { DataSource } from 'typeorm';
import { NestDomainEventPublisher } from '../../secondary/providers/NestDomainEventPublisher';
import { TypeOrmTransactionPerformer } from '../../secondary/providers/typeOrmTransactionPerformer';
import { FakeDomainEventRepository } from '../../secondary/repositories/fakeDomainEventRepository';
import { ormConfig } from '../../secondary/repositories/orm-config';
import { DomainEventsPoller } from './domainEventPoller';

export const DATE_TIME_PROVIDER = 'DATE_TIME_PROVIDER';
export const UUID_GENERATOR = 'UUID_GENERATOR';
export const TRANSACTION_PERFORMER = 'TRANSACTION_PERFORMER';
export const DOMAIN_EVENT_REPOSITORY = 'DOMAIN_EVENT_REPOSITORY';
export const DOMAIN_EVENT_PUBLISHER = 'DOMAIN_EVENT_PUBLISHER';
export const DOMAIN_EVENTS_POLLER = 'DOMAIN_EVENTS_POLLER';
export const DATA_SOURCE = 'DATA_SOURCE';

@Module({
  imports: [EventEmitterModule.forRoot()],
  exports: [
    DATA_SOURCE,
    DATE_TIME_PROVIDER,
    UUID_GENERATOR,
    TRANSACTION_PERFORMER,
    DOMAIN_EVENT_REPOSITORY,
    DOMAIN_EVENTS_POLLER,
  ],
  controllers: [],
  providers: [
    {
      provide: TRANSACTION_PERFORMER,
      useFactory: (dataSource: DataSource) => {
        return new TypeOrmTransactionPerformer(dataSource);
      },
      inject: [DATA_SOURCE],
    },
    {
      provide: DATA_SOURCE,
      useFactory: async () => {
        const dataSource = new DataSource(ormConfig());
        await dataSource.initialize();
        return dataSource;
      },
    },

    {
      provide: DOMAIN_EVENTS_POLLER,
      useFactory: (
        domainEventRepository: DomainEventRepository,
        domainEventPublisher: DomainEventPublisher,
        transactionPerformer: TransactionPerformer,
      ) =>
        new DomainEventsPoller(
          domainEventRepository,
          domainEventPublisher,
          transactionPerformer,
        ),
      inject: [
        DOMAIN_EVENT_REPOSITORY,
        DOMAIN_EVENT_PUBLISHER,
        TRANSACTION_PERFORMER,
      ],
    },
    {
      provide: DOMAIN_EVENT_PUBLISHER,
      useFactory: (eventEmitter: EventEmitter2) => {
        return new NestDomainEventPublisher(eventEmitter);
      },
      inject: [EventEmitter2],
    },
    {
      provide: DOMAIN_EVENT_REPOSITORY,
      useClass: FakeDomainEventRepository,
    },

    {
      provide: DATE_TIME_PROVIDER,
      useValue: new (class DateTimeProvider {
        now = () => new Date();
      })(),
    },
    {
      provide: UUID_GENERATOR,
      useValue: new (class UuidGenerator {
        generate() {
          return crypto.randomUUID();
        }
      })(),
    },
  ],
})
export class SharedKernelModule {}
