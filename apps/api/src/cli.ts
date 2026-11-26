import './instrument';
import { Module } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { CommandFactory } from 'nest-commander';

import { AppModule } from './app.module';
import { DeleteUnusedFilesCliModule } from './modules/framework/files/delete-unused-files.cli';
import { SENTRY_FLUSH_TIMEOUT } from './modules/framework/observability';
import { IngestCliModule } from './modules/ingest/ingest-cli.module';
import { AuthCliModule } from './modules/simple-auth/infrastructure/cli/auth-cli.module';

@Module({
  imports: [AppModule, AuthCliModule, DeleteUnusedFilesCliModule, IngestCliModule],
})
class CliAppModule {}

cli().catch(reportAndExit);

function reportAndExit(error: unknown): void {
  console.error('ERROR', error);
  process.exitCode = 1;

  Sentry.captureException(error);
  void Sentry.flush(SENTRY_FLUSH_TIMEOUT).then(() => process.exit(1));
}

async function cli() {
  await CommandFactory.run(CliAppModule, {
    logger: ['verbose', 'debug', 'log', 'warn', 'error', 'fatal'],
    // The errors of commander only, as an unknown option
    errorHandler: reportAndExit,
    // An error thrown by a command would only be written on stderr, and the process would end with 0
    serviceErrorHandler: (error: unknown) => {
      throw error;
    },
  });
}
