import { Inject, Module, OnModuleInit } from '@nestjs/common';
import { DomainRegistry } from 'src/data-administration-context/business-logic/models/domain-registry';
import { TransparenceService } from 'src/data-administration-context/business-logic/services/transparence.service';
import { ImportNominationFilesUseCase } from 'src/data-administration-context/business-logic/use-cases/nomination-files-import/import-nomination-files.use-case';
import { SystemRequestSignatureProvider } from 'src/identity-and-access-context/adapters/secondary/gateways/providers/service-request-signature.provider';
import { SharedKernelModule } from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import {
  API_CONFIG,
  DATE_TIME_PROVIDER,
  DOMAIN_EVENT_REPOSITORY,
  TRANSACTION_PERFORMER,
  UUID_GENERATOR,
} from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { ApiConfig } from 'src/shared-kernel/adapters/primary/zod/api-config-schema';
import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { FileReaderProvider } from 'src/shared-kernel/business-logic/gateways/providers/file-reader.provider';
import { UuidGenerator } from 'src/shared-kernel/business-logic/gateways/providers/uuid-generator';
import { DomainEventRepository } from 'src/shared-kernel/business-logic/gateways/repositories/domain-event.repository';
import { ImportNominationFileFromLocalFileCli } from '../../../business-logic/gateways/providers/import-nominations-from-local-file.cli';
import { SqlTransparenceRepository } from '../../secondary/gateways/repositories/drizzle/sql-transparence.repository';
import { HttpUserService } from '../../secondary/gateways/services/http-user.service';
import { generateDataAdministrationProvider as generateProvider } from './provider-generator';
import {
  IMPORT_NOMINATION_FILE_FROM_LOCAL_FILE_CLI,
  TRANSPARENCE_REPOSITORY,
  USER_SERVICE,
} from './tokens';

@Module({
  imports: [SharedKernelModule],
  providers: [
    generateProvider(ImportNominationFilesUseCase, [
      TRANSACTION_PERFORMER,
      TransparenceService,
    ]),

    generateProvider(TransparenceService, [
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
export class DataAdministrationContextModule implements OnModuleInit {
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
}
