import { Module } from '@nestjs/common';
import { ImportNominationFilesUseCase } from 'src/data-administrator-context/business-logic/use-cases/nomination-files-import/import-nomination-files.use-case';
import {
  DATE_TIME_PROVIDER,
  DOMAIN_EVENT_REPOSITORY,
  SharedKernelModule,
  TRANSACTION_PERFORMER,
  UUID_GENERATOR,
} from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import { FileReaderProvider } from 'src/shared-kernel/business-logic/gateways/providers/file-reader.provider';
import { FakeNominationFileRepository } from '../../secondary/gateways/repositories/fake-nomination-file-repository';
import { ImportNominationFileFromLocalFileCli } from './cli/import-nominations-from-local-file.cli';

export const NOMINATION_FILE_REPOSITORY = 'NOMINATION_FILE_REPOSITORY';
export const IMPORT_NOMINATION_FILE_FROM_LOCAL_FILE_CLI =
  'IMPORT_NOMINATION_FILE_FROM_LOCAL_FILE_CLI';

const importNominationFilesUseCaseUseFactory: (
  ...args: ConstructorParameters<typeof ImportNominationFilesUseCase>
) => ImportNominationFilesUseCase = (
  nominationFileRepository,
  dateTimeProvider,
  uuidGenerator,
  transactionPerformer,
  domainEventRepository,
) =>
  new ImportNominationFilesUseCase(
    nominationFileRepository,
    dateTimeProvider,
    uuidGenerator,
    transactionPerformer,
    domainEventRepository,
  );

@Module({
  imports: [SharedKernelModule],
  providers: [
    {
      provide: ImportNominationFilesUseCase,
      useFactory: importNominationFilesUseCaseUseFactory,
      inject: [
        NOMINATION_FILE_REPOSITORY,
        DATE_TIME_PROVIDER,
        UUID_GENERATOR,
        TRANSACTION_PERFORMER,
        DOMAIN_EVENT_REPOSITORY,
      ],
    },
    {
      provide: NOMINATION_FILE_REPOSITORY,
      useFactory: (): FakeNominationFileRepository => {
        const repository = new FakeNominationFileRepository();
        return repository;
      },
    },
    {
      provide: IMPORT_NOMINATION_FILE_FROM_LOCAL_FILE_CLI,
      useFactory: (
        fileReader: FileReaderProvider,
        importNominationFilesUseCase: ImportNominationFilesUseCase,
      ) =>
        new ImportNominationFileFromLocalFileCli(
          fileReader,
          importNominationFilesUseCase,
        ),
      inject: [FileReaderProvider, ImportNominationFilesUseCase],
    },
  ],
  exports: [],
})
export class DataAdministrationContextModule {}
