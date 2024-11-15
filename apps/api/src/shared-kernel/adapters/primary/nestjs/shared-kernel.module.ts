import { Module } from '@nestjs/common';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { DomainEventPublisher } from 'src/shared-kernel/business-logic/gateways/providers/domain-event-publisher';
import { FileReaderProvider } from 'src/shared-kernel/business-logic/gateways/providers/file-reader.provider';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { DomainEventRepository } from 'src/shared-kernel/business-logic/gateways/repositories/domain-event.repository';
import { DrizzleTransactionPerformer } from '../../secondary/gateways/providers/drizzle-transaction-performer';
import { NestDomainEventPublisher } from '../../secondary/gateways/providers/nest-domain-event-publisher';
import { getDrizzleConfig } from '../../secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from '../../secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { SqlDomainEventRepository } from '../../secondary/gateways/repositories/drizzle/sql-domain-event-repository';
import { ApiConfig } from '../nestia/api-config-schema';
import { DomainEventsPoller } from './domain-event-poller';
import { apiConfig, defaultApiConfig } from './env';
import { validate } from './env.validation';

export const DATE_TIME_PROVIDER = 'DATE_TIME_PROVIDER';
export const UUID_GENERATOR = 'UUID_GENERATOR';
export const TRANSACTION_PERFORMER = 'TRANSACTION_PERFORMER';
export const DOMAIN_EVENT_REPOSITORY = 'DOMAIN_EVENT_REPOSITORY';
export const DOMAIN_EVENT_PUBLISHER = 'DOMAIN_EVENT_PUBLISHER';
export const DOMAIN_EVENTS_POLLER = 'DOMAIN_EVENTS_POLLER';
export const DRIZZLE_DB = 'DRIZZLE_DB';
export const API_CONFIG = 'API_CONFIG';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [EventEmitterModule.forRoot()],
  exports: [
    DRIZZLE_DB,
    DATE_TIME_PROVIDER,
    UUID_GENERATOR,
    TRANSACTION_PERFORMER,
    DOMAIN_EVENT_REPOSITORY,
    DOMAIN_EVENTS_POLLER,
    FileReaderProvider,
  ],
  controllers: [],
  providers: [
    {
      provide: API_CONFIG,
      useFactory: (): ApiConfig =>
        isProduction
          ? validate<true>(apiConfig)
          : validate<false>(defaultApiConfig),
    },
    {
      provide: TRANSACTION_PERFORMER,
      useFactory: (db: DrizzleDb) => {
        return new DrizzleTransactionPerformer(db);
      },
      inject: [DRIZZLE_DB],
    },
    {
      provide: DRIZZLE_DB,
      useFactory: (config: ApiConfig) => {
        const db = getDrizzleInstance(
          isProduction
            ? getDrizzleConfig<true>(
                config.database as ApiConfig<true>['database'],
              )
            : getDrizzleConfig<false>(
                config.database as ApiConfig<false>['database'],
              ),
        );
        return db;
      },
      inject: [API_CONFIG],
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
      useClass: SqlDomainEventRepository,
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

    FileReaderProvider,
  ],
})
export class SharedKernelModule {}
