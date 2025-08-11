import {
  Inject,
  MiddlewareConsumer,
  Module,
  NestModule,
  OnModuleInit,
} from '@nestjs/common';
import { TransparenceService as TransparenceCsvService } from 'src/data-administration-context/transparence-tsv/business-logic/services/transparence.service';
import { ImportNominationFilesUseCase } from 'src/data-administration-context/transparence-tsv/business-logic/use-cases/nomination-files-import/import-nomination-files.use-case';
import { IACFileRepository } from 'src/data-administration-context/transparence-xlsx/business-logic/gateways/repositories/iac-file-repository';
import { TransparenceFileRepository } from 'src/data-administration-context/transparence-xlsx/business-logic/gateways/repositories/transparence-file-repository';
import { TransparenceService as TransparenceXlsxService } from 'src/data-administration-context/transparence-xlsx/business-logic/services/transparence.service';
import { GetTransparenceAttachmentsUseCase } from 'src/data-administration-context/transparence-xlsx/business-logic/use-cases/get-transparence-attachements/get-transparence-attachments.use-case';
import { GetTransparenceSnapshotUseCase } from 'src/data-administration-context/transparence-xlsx/business-logic/use-cases/get-transparence-snapshot/get-transparence-snapshot.use-case';
import { ImportObservantsXlsxUseCase } from 'src/data-administration-context/transparence-xlsx/business-logic/use-cases/import-observants-xlsx/import-observants-xlsx.use-case';
import { ImportSessionAttachmentUseCase } from 'src/data-administration-context/transparence-xlsx/business-logic/use-cases/import-session-attachment/import-session-attachment.use-case';
import { ImportTransparenceXlsxUseCase } from 'src/data-administration-context/transparence-xlsx/business-logic/use-cases/import-transparence-xlsx/import-transparence-xlsx.use-case';
import { SqlIacFilesRepository } from 'src/data-administration-context/transparences/adapters/secondary/gateways/repositories/drizzle/sql-iac-files.repository';
import { DomainRegistry } from 'src/data-administration-context/transparences/business-logic/models/domain-registry';
import { SystemRequestSignatureProvider } from 'src/identity-and-access-context/adapters/secondary/gateways/providers/service-request-signature.provider';
import { SessionValidationMiddleware } from 'src/shared-kernel/adapters/primary/nestjs/middleware/session-validation.middleware';
import { SharedKernelModule } from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import {
  API_CONFIG,
  DATE_TIME_PROVIDER,
  DOMAIN_EVENT_REPOSITORY,
  TRANSACTION_PERFORMER,
  UPLOAD_FILE_SERVICE,
  UUID_GENERATOR,
} from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/zod/api-config-schema';
import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { FileReaderProvider } from 'src/shared-kernel/business-logic/gateways/providers/file-reader.provider';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { UuidGenerator } from 'src/shared-kernel/business-logic/gateways/providers/uuid-generator';
import { DomainEventRepository } from 'src/shared-kernel/business-logic/gateways/repositories/domain-event.repository';
import { UploadFileService } from 'src/shared-kernel/business-logic/services/upload-file.service';
import { ImportNominationFileFromLocalFileCli } from '../../../../transparence-tsv/adapters/primary/nestjs/import-nominations-from-local-file.cli';
import { SqlTransparenceFilesRepository } from '../../../../transparences/adapters/secondary/gateways/repositories/drizzle/sql-transparence-files.repository';
import { SqlTransparenceRepository } from '../../../../transparences/adapters/secondary/gateways/repositories/drizzle/sql-transparence.repository';
import { HttpUserService } from '../../../../transparences/adapters/secondary/gateways/services/http-user.service';
import { DataAdministrationController } from './data-administration.controller';
import { generateDataAdministrationProvider as generateProvider } from './provider-generator';
import {
  IAC_FILE_REPOSITORY,
  IMPORT_NOMINATION_FILE_FROM_LOCAL_FILE_CLI,
  TRANSPARENCE_FILE_REPOSITORY,
  TRANSPARENCE_REPOSITORY,
  USER_SERVICE,
} from './tokens';

@Module({
  imports: [SharedKernelModule],
  controllers: [DataAdministrationController],
  providers: [
    generateProvider(ImportNominationFilesUseCase, [
      TRANSACTION_PERFORMER,
      TransparenceCsvService,
    ]),
    generateProvider(ImportTransparenceXlsxUseCase, [
      TRANSACTION_PERFORMER,
      TransparenceXlsxService,
    ]),
    generateProvider(ImportObservantsXlsxUseCase, [
      TRANSACTION_PERFORMER,
      TransparenceXlsxService,
    ]),
    generateProvider(GetTransparenceSnapshotUseCase, [
      TRANSACTION_PERFORMER,
      TransparenceXlsxService,
    ]),
    generateProvider(
      SqlTransparenceFilesRepository,
      [],
      TRANSPARENCE_FILE_REPOSITORY,
    ),
    generateProvider(SqlIacFilesRepository, [], IAC_FILE_REPOSITORY),
    {
      provide: ImportSessionAttachmentUseCase,
      useFactory: (
        apiConfig: ApiConfig,
        transactionPerformer: TransactionPerformer,
        uploadFileService: UploadFileService,
        transparenceFileRepository: TransparenceFileRepository,
        iacFileRepository: IACFileRepository,
      ) =>
        new ImportSessionAttachmentUseCase(
          apiConfig,
          transactionPerformer,
          uploadFileService,
          transparenceFileRepository,
          iacFileRepository,
        ),
      inject: [
        API_CONFIG,
        TRANSACTION_PERFORMER,
        UPLOAD_FILE_SERVICE,
        TRANSPARENCE_FILE_REPOSITORY,
        IAC_FILE_REPOSITORY,
      ],
    },
    generateProvider(GetTransparenceAttachmentsUseCase, [
      TRANSACTION_PERFORMER,
      TRANSPARENCE_FILE_REPOSITORY,
      UPLOAD_FILE_SERVICE,
    ]),
    generateProvider(TransparenceCsvService, [
      DOMAIN_EVENT_REPOSITORY,
      TRANSPARENCE_REPOSITORY,
      USER_SERVICE,
    ]),
    generateProvider(TransparenceXlsxService, [
      DOMAIN_EVENT_REPOSITORY,
      TRANSPARENCE_REPOSITORY,
      USER_SERVICE,
    ]),

    {
      provide: USER_SERVICE,
      useFactory: (
        apiConfig: ApiConfig,
        systemRequestSignatureProvider: SystemRequestSignatureProvider,
      ) => new HttpUserService(apiConfig, systemRequestSignatureProvider),
      inject: [API_CONFIG, SystemRequestSignatureProvider],
    },

    generateProvider(SqlTransparenceRepository, [], TRANSPARENCE_REPOSITORY),
    generateProvider(
      ImportNominationFileFromLocalFileCli,
      [FileReaderProvider, ImportNominationFilesUseCase],
      IMPORT_NOMINATION_FILE_FROM_LOCAL_FILE_CLI,
    ),
  ],
  exports: [],
})
export class DataAdministrationContextModule
  implements NestModule, OnModuleInit
{
  constructor(
    @Inject(UUID_GENERATOR)
    private readonly uuidGenerator: UuidGenerator,
    @Inject(DATE_TIME_PROVIDER)
    private readonly dateTimeProvider: DateTimeProvider,
    @Inject(DOMAIN_EVENT_REPOSITORY)
    private readonly domainEventRepository: DomainEventRepository,
  ) {}

  onModuleInit() {
    DomainRegistry.setUuidGenerator(this.uuidGenerator);
    DomainRegistry.setDateTimeProvider(this.dateTimeProvider);
    DomainRegistry.setDomainEventRepository(this.domainEventRepository);
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SessionValidationMiddleware)
      .forRoutes(DataAdministrationController);
  }
}
