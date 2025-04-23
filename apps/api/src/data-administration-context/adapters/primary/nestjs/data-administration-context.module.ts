import { Inject, Module, OnModuleInit } from '@nestjs/common';
import { TransparenceService } from 'src/data-administration-context/business-logic/services/transparence.service';
import { ImportNominationFilesUseCase } from 'src/data-administration-context/business-logic/use-cases/nomination-files-import/import-nomination-files.use-case';
import { SharedKernelModule } from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import {
  DATE_TIME_PROVIDER,
  DOMAIN_EVENT_REPOSITORY,
  TRANSACTION_PERFORMER,
  UUID_GENERATOR,
} from 'src/shared-kernel/adapters/primary/nestjs/tokens';
import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { FileReaderProvider } from 'src/shared-kernel/business-logic/gateways/providers/file-reader.provider';
import { UuidGenerator } from 'src/shared-kernel/business-logic/gateways/providers/uuid-generator';
import { ImportNominationFileFromLocalFileCli } from '../../../business-logic/gateways/providers/import-nominations-from-local-file.cli';
import { SqlNominationFileRepository } from '../../secondary/gateways/repositories/drizzle/sql-nomination-file.repository';
import { generateDataAdministrationProvider as generateProvider } from './provider-generator';
import {
  IMPORT_NOMINATION_FILE_FROM_LOCAL_FILE_CLI,
  NOMINATION_FILE_REPOSITORY,
} from './tokens';
import { DomainRegistry } from 'src/data-administration-context/business-logic/models/domain-registry';

@Module({
  imports: [SharedKernelModule],
  providers: [
    generateProvider(ImportNominationFilesUseCase, [
      TRANSACTION_PERFORMER,
      TransparenceService,
    ]),

    generateProvider(TransparenceService, [
      NOMINATION_FILE_REPOSITORY,
      DOMAIN_EVENT_REPOSITORY,
    ]),

    generateProvider(
      SqlNominationFileRepository,
      [],
      NOMINATION_FILE_REPOSITORY,
    ),

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
  ) {}

  onModuleInit() {
    DomainRegistry.setUuidGenerator(this.uuidGenerator);
    DomainRegistry.setDateTimeProvider(this.dateTimeProvider);
  }
}
