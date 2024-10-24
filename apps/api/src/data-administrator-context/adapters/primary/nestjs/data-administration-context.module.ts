import { Module } from '@nestjs/common';
import { ImportNominationFilesUseCase } from 'src/data-administrator-context/business-logic/use-cases/nomination-files-import/import-nomination-files.use-case';
import { SetReportIdUseCase } from 'src/data-administrator-context/business-logic/use-cases/report-id-set/set-report-id.use-case';
import {
  DATE_TIME_PROVIDER,
  DOMAIN_EVENT_REPOSITORY,
  SharedKernelModule,
  TRANSACTION_PERFORMER,
  UUID_GENERATOR,
} from 'src/shared-kernel/adapters/primary/nestjs/shared-kernel.module';
import { FileReaderProvider } from 'src/shared-kernel/business-logic/gateways/providers/file-reader.provider';
import { SqlNominationFileRepository } from '../../secondary/gateways/repositories/drizzle/sql-nomination-file.repository';
import { ImportNominationFileFromLocalFileCli } from './cli/import-nominations-from-local-file.cli';
import { ReportCreatedSubscriber } from './event-subscribers/report-created.subscriber';

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

const setReportIdUseCaseFactory: (
  ...args: ConstructorParameters<typeof SetReportIdUseCase>
) => SetReportIdUseCase = (transactionPerformer, nominationFileRepository) =>
  new SetReportIdUseCase(transactionPerformer, nominationFileRepository);

const setReportCreatedSubscriberFactory: (
  ...args: ConstructorParameters<typeof ReportCreatedSubscriber>
) => ReportCreatedSubscriber = (setReportIdUseCase) =>
  new ReportCreatedSubscriber(setReportIdUseCase);

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
      provide: SetReportIdUseCase,
      useFactory: setReportIdUseCaseFactory,
      inject: [TRANSACTION_PERFORMER, NOMINATION_FILE_REPOSITORY],
    },

    {
      provide: ReportCreatedSubscriber,
      useFactory: setReportCreatedSubscriberFactory,
      inject: [SetReportIdUseCase],
    },

    {
      provide: NOMINATION_FILE_REPOSITORY,
      useFactory: (): SqlNominationFileRepository =>
        new SqlNominationFileRepository(),
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
