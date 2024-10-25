import { NestFactory } from '@nestjs/core';
import path from 'path';
import { ImportNominationFileFromLocalFileCli } from 'src/data-administrator-context/adapters/primary/nestjs/cli/import-nominations-from-local-file.cli';
import {
  DataAdministrationContextModule,
  IMPORT_NOMINATION_FILE_FROM_LOCAL_FILE_CLI,
} from 'src/data-administrator-context/adapters/primary/nestjs/data-administration-context.module';

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
};

const absoluteFilePath = process.argv[2];
if (!absoluteFilePath) throw new Error('File path argument is required');
const isAbsoluteFilePath = path.isAbsolute(absoluteFilePath);
if (!isAbsoluteFilePath)
  throw new Error('File path argument must be an absolute path');

runImportNominationsFromLocalFileCli(absoluteFilePath);
