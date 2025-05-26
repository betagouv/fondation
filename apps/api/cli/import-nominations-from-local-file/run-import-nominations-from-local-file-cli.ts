import { NestFactory } from '@nestjs/core';
import path from 'path';
import { DataAdministrationContextModule } from 'src/data-administration-context/transparence-xlsx/adapters/primary/nestjs/data-administration-context.module';
import { IMPORT_NOMINATION_FILE_FROM_LOCAL_FILE_CLI } from 'src/data-administration-context/transparence-xlsx/adapters/primary/nestjs/tokens';
import { ImportNominationFileFromLocalFileCli } from 'src/data-administration-context/transparence-tsv/business-logic/gateways/providers/import-nominations-from-local-file.cli';
import { setTimeout } from 'timers/promises';

const runImportNominationsFromLocalFileCli = async (
  absoluteFilePath: string,
) => {
  const app = await NestFactory.createApplicationContext(
    DataAdministrationContextModule,
  );
  const importNominationFileFromLocalFileCli = app.get<
    InstanceType<typeof ImportNominationFileFromLocalFileCli>
  >(IMPORT_NOMINATION_FILE_FROM_LOCAL_FILE_CLI);

  await importNominationFileFromLocalFileCli.execute(absoluteFilePath);
  await setTimeout(10000);
  await app.close();
};

const absoluteFilePath = process.argv[2];
if (!absoluteFilePath) throw new Error('File path argument is required');
const isAbsoluteFilePath = path.isAbsolute(absoluteFilePath);
if (!isAbsoluteFilePath)
  throw new Error('File path argument must be an absolute path');

runImportNominationsFromLocalFileCli(absoluteFilePath);
