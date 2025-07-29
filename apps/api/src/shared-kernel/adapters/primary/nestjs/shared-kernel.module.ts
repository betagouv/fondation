import { Module } from '@nestjs/common';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { S3StorageProvider } from 'src/files-context/business-logic/gateways/providers/s3-storage.provider';
import { FileRepository } from 'src/files-context/business-logic/gateways/repositories/file-repository';
import { SystemRequestSignatureProvider } from 'src/identity-and-access-context/adapters/secondary/gateways/providers/service-request-signature.provider';
import { validateConfig } from 'src/shared-kernel/adapters/primary/nestjs/env.validation';
import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { FileReaderProvider } from 'src/shared-kernel/business-logic/gateways/providers/file-reader.provider';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { SentryService } from 'src/shared-kernel/business-logic/gateways/services/sentry.service';
import { SessionValidationService } from 'src/shared-kernel/business-logic/gateways/services/session-validation.service';
import { UploadFileService } from 'src/shared-kernel/business-logic/services/upload-file.service';
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
} from '../zod/api-config-schema';
import { DomainEventsPoller } from './domain-event-poller';
import { apiConfig } from './env';
import { SessionValidationMiddleware } from './middleware/session-validation.middleware';
import { SystemRequestValidationMiddleware } from './middleware/system-request.middleware';
import { generateSharedKernelProvider as generateProvider } from './shared-kernel-provider-generator';
import {
  API_CONFIG,
  DATE_TIME_PROVIDER,
  DOMAIN_EVENT_PUBLISHER,
  DOMAIN_EVENT_REPOSITORY,
  DOMAIN_EVENTS_POLLER,
  DRIZZLE_DB,
  SENTRY_SERVICE,
  TRANSACTION_PERFORMER,
  UPLOAD_FILE_SERVICE,
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
    SessionValidationService,
    SystemRequestSignatureProvider,
    SystemRequestValidationMiddleware,
    SessionValidationMiddleware,
    UPLOAD_FILE_SERVICE,
  ],
  controllers: [],
  providers: [
    {
      provide: API_CONFIG,
      useFactory: (): ApiConfig => validateConfig(),
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
    {
      provide: SessionValidationService,
      // generateProvider function doesn't handle the union type in ApiConfig
      useFactory: (apiConfig: ApiConfig) => {
        return new SessionValidationService(apiConfig);
      },
      inject: [API_CONFIG],
    },
    {
      provide: SystemRequestSignatureProvider,
      useFactory: (apiConfig: ApiConfig) => {
        return new SystemRequestSignatureProvider(apiConfig);
      },
      inject: [API_CONFIG],
    },
    {
      provide: SENTRY_SERVICE,
      useFactory: (): SentryService => {
        if (!apiConfig.sentryDsn && isProduction) {
          throw new Error('Sentry DSN is not set');
        }
        return new SentryService(isProduction, apiConfig.sentryDsn);
      },
    },
    {
      provide: UPLOAD_FILE_SERVICE,
      useFactory: (
        transactionPerformer: TransactionPerformer,
        fileRepository: FileRepository,
        dateTimeProvider: DateTimeProvider,
        s3StorageProvider: S3StorageProvider,
        apiConfig: ApiConfig,
      ) => {
        return new UploadFileService(
          transactionPerformer,
          fileRepository,
          dateTimeProvider,
          s3StorageProvider,
          apiConfig,
        );
      },
      inject: [API_CONFIG],
    },
    SystemRequestValidationMiddleware,
    SessionValidationMiddleware,
  ],
})
export class SharedKernelModule {}
