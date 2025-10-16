import { S3Client } from '@aws-sdk/client-s3';
import { Module } from '@nestjs/common';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import {
  FILE_REPOSITORY,
  S3_STORAGE_PROVIDER,
} from 'src/files-context/adapters/primary/nestjs/tokens';

import {
  DossierDeNominationRestContrat,
  IdentityAndAccessRestContract,
  NominationsContextSessionsRestContract,
  UserRestContract,
} from 'shared-models';
import { MinioS3Commands } from 'src/files-context/adapters/secondary/gateways/providers/minio-s3-commands';
import { minioS3StorageClient } from 'src/files-context/adapters/secondary/gateways/providers/minio-s3-sorage.client';
import { RealS3StorageProvider } from 'src/files-context/adapters/secondary/gateways/providers/real-s3-storage.provider';
import { scalewayS3StorageClient } from 'src/files-context/adapters/secondary/gateways/providers/scaleway-s3-sorage.client';
import { SqlFileRepository } from 'src/files-context/adapters/secondary/gateways/repositories/drizzle/sql-file.repository';
import { S3Commands } from 'src/files-context/business-logic/gateways/providers/s3-commands';
import { S3StorageProvider } from 'src/files-context/business-logic/gateways/providers/s3-storage.provider';
import { FileRepository } from 'src/files-context/business-logic/gateways/repositories/file-repository';
import { SystemRequestSignatureProvider } from 'src/identity-and-access-context/adapters/secondary/gateways/providers/service-request-signature.provider';
import { validateConfig } from 'src/shared-kernel/adapters/primary/nestjs/env.validation';
import { BoundedContextHttpClient } from 'src/shared-kernel/adapters/secondary/gateways/providers/bounded-context-htttp-client';
import { HttpDossierDeNominationService } from 'src/shared-kernel/adapters/secondary/gateways/services/http-dossier-de-nomination.service';
import { HttpSessionService } from 'src/shared-kernel/adapters/secondary/gateways/services/http-session.service';
import { HttpUserService } from 'src/shared-kernel/adapters/secondary/gateways/services/http-user.service';
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
  DOSSIER_DE_NOMINATION_CONTEXT_HTTP_CLIENT,
  DOSSIER_DE_NOMINATION_SERVICE,
  DRIZZLE_DB,
  IDENTITY_AND_ACCESS_CONTEXT_HTTP_CLIENT,
  NOMINATIONS_CONTEXT_HTTP_CLIENT,
  USER_CONTEXT_HTTP_CLIENT,
  SENTRY_SERVICE,
  SESSION_SERVICE,
  TRANSACTION_PERFORMER,
  UPLOAD_FILE_SERVICE,
  USER_SERVICE,
  UUID_GENERATOR,
} from './tokens';

const isProduction = process.env.NODE_ENV === 'production';
const isScalewayS3 = isProduction;
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
    USER_SERVICE,
    SESSION_SERVICE,
    DOSSIER_DE_NOMINATION_SERVICE,
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
    generateProvider(SqlFileRepository, [], FILE_REPOSITORY),
    {
      provide: S3_STORAGE_PROVIDER,
      useFactory: (
        s3Client: S3Client,
        apiConfig: ApiConfig,
        s3Commands: S3Commands,
      ) => {
        return new RealS3StorageProvider(s3Client, apiConfig, s3Commands);
      },
      inject: [S3Client, API_CONFIG, S3Commands],
    },
    {
      provide: S3Client,
      useValue: isScalewayS3 ? scalewayS3StorageClient : minioS3StorageClient,
    },
    { provide: S3Commands, useClass: MinioS3Commands },

    {
      provide: UPLOAD_FILE_SERVICE,
      useFactory: (
        transactionPerformer: TransactionPerformer,
        fileRepository: FileRepository,
        dateTimeProvider: DateTimeProvider,
        s3StorageProvider: S3StorageProvider,
      ) => {
        return new UploadFileService(
          transactionPerformer,
          fileRepository,
          dateTimeProvider,
          s3StorageProvider,
        );
      },
      inject: [
        TRANSACTION_PERFORMER,
        FILE_REPOSITORY,
        DATE_TIME_PROVIDER,
        S3_STORAGE_PROVIDER,
      ],
    },

    generateProvider(
      HttpUserService,
      [IDENTITY_AND_ACCESS_CONTEXT_HTTP_CLIENT, USER_CONTEXT_HTTP_CLIENT],
      USER_SERVICE,
    ),
    {
      provide: IDENTITY_AND_ACCESS_CONTEXT_HTTP_CLIENT,
      useFactory: (
        apiConfig: ApiConfig,
        systemRequestSignatureProvider: SystemRequestSignatureProvider,
      ) => {
        return new BoundedContextHttpClient<IdentityAndAccessRestContract>(
          apiConfig,
          systemRequestSignatureProvider,
          'api/auth',
        );
      },
      inject: [API_CONFIG, SystemRequestSignatureProvider],
    },
    {
      provide: USER_CONTEXT_HTTP_CLIENT,
      useFactory: (
        apiConfig: ApiConfig,
        systemRequestSignatureProvider: SystemRequestSignatureProvider,
      ) => {
        return new BoundedContextHttpClient<UserRestContract>(
          apiConfig,
          systemRequestSignatureProvider,
          'api/users',
        );
      },
      inject: [API_CONFIG, SystemRequestSignatureProvider],
    },
    {
      provide: NOMINATIONS_CONTEXT_HTTP_CLIENT,
      useFactory: (
        apiConfig: ApiConfig,
        systemRequestSignatureProvider: SystemRequestSignatureProvider,
      ) => {
        return new BoundedContextHttpClient<NominationsContextSessionsRestContract>(
          apiConfig,
          systemRequestSignatureProvider,
          'api/nominations/sessions',
        );
      },
      inject: [API_CONFIG, SystemRequestSignatureProvider],
    },
    {
      provide: DOSSIER_DE_NOMINATION_CONTEXT_HTTP_CLIENT,
      useFactory: (
        apiConfig: ApiConfig,
        systemRequestSignatureProvider: SystemRequestSignatureProvider,
      ) => {
        return new BoundedContextHttpClient<DossierDeNominationRestContrat>(
          apiConfig,
          systemRequestSignatureProvider,
          'api/nominations/dossier-de-nominations',
        );
      },
      inject: [API_CONFIG, SystemRequestSignatureProvider],
    },

    generateProvider(
      HttpSessionService,
      [NOMINATIONS_CONTEXT_HTTP_CLIENT],
      SESSION_SERVICE,
    ),
    generateProvider(
      HttpDossierDeNominationService,
      [DOSSIER_DE_NOMINATION_CONTEXT_HTTP_CLIENT],
      DOSSIER_DE_NOMINATION_SERVICE,
    ),
    SystemRequestValidationMiddleware,
    SessionValidationMiddleware,
  ],
})
export class SharedKernelModule {}
