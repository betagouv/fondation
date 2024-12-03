import { Module } from '@nestjs/common';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { FileReaderProvider } from 'src/shared-kernel/business-logic/gateways/providers/file-reader.provider';
import { DrizzleTransactionPerformer } from '../../secondary/gateways/providers/drizzle-transaction-performer';
import { NestDomainEventPublisher } from '../../secondary/gateways/providers/nest-domain-event-publisher';
import { getDrizzleConfig } from '../../secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from '../../secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { SqlDomainEventRepository } from '../../secondary/gateways/repositories/drizzle/sql-domain-event-repository';
import {
  ApiConfig,
  DevApiConfig,
  ProdApiConfig,
} from '../nestia/api-config-schema';
import { DomainEventsPoller } from './domain-event-poller';
import { apiConfig, defaultApiConfig } from './env';
import { validateDevConfig, validateProdConfig } from './env.validation';
import { generateSharedKernelProvider as generateProvider } from './shared-kernel-provider-generator';
import {
  API_CONFIG,
  DATE_TIME_PROVIDER,
  DOMAIN_EVENT_PUBLISHER,
  DOMAIN_EVENT_REPOSITORY,
  DOMAIN_EVENTS_POLLER,
  DRIZZLE_DB,
  TRANSACTION_PERFORMER,
  UUID_GENERATOR,
} from './tokens';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [EventEmitterModule.forRoot()],
  exports: [
    API_CONFIG,
    DRIZZLE_DB,
    UUID_GENERATOR,
    DATE_TIME_PROVIDER,
    DOMAIN_EVENTS_POLLER,
    TRANSACTION_PERFORMER,
    DOMAIN_EVENT_REPOSITORY,
    FileReaderProvider,
  ],
  controllers: [],
  providers: [
    {
      provide: API_CONFIG,
      useFactory: (): ApiConfig =>
        isProduction
          ? validateProdConfig(apiConfig)
          : validateDevConfig(defaultApiConfig),
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
                config.database as ProdApiConfig['database'],
              )
            : getDrizzleConfig<false>(
                config.database as DevApiConfig['database'],
              ),
        );
        return db;
      },
      inject: [API_CONFIG],
    },

    generateProvider(
      DomainEventsPoller,
      [DOMAIN_EVENT_REPOSITORY, DOMAIN_EVENT_PUBLISHER, TRANSACTION_PERFORMER],
      DOMAIN_EVENTS_POLLER,
    ),
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
