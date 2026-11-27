import './instrument';
import { Module } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { CommandFactory } from 'nest-commander';

import { AppModule } from './app.module';
import { CommandName } from './modules/framework/command-name';
import { DeleteUnusedFilesCliModule } from './modules/framework/files/delete-unused-files.cli';
import { ApiLogger } from './modules/framework/logger';
import { SENTRY_FLUSH_TIMEOUT } from './modules/framework/observability';
import { WideEvent } from './modules/framework/wide-event';
import { IngestCliModule } from './modules/ingest/ingest-cli.module';
import { AuthCliModule } from './modules/simple-auth/infrastructure/cli/auth-cli.module';

@Module({
  imports: [AppModule, AuthCliModule, DeleteUnusedFilesCliModule, IngestCliModule],
  providers: [CommandName],
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
  const app = await CommandFactory.createWithoutRunning(CliAppModule, {
    // Every level, debug and verbose included, as an application whose logger has no logLevels
    logger: new ApiLogger(),
    // No errorHandler: commander exits as soon as it returns, before Sentry gets anything, and would call --help an error
    // An error thrown by a command would only be written on stderr, and the process would end with 0
    serviceErrorHandler: (error: unknown) => {
      throw error;
    },
  });

  try {
    await app.get(WideEvent).runCommand(() => CommandFactory.runApplication(app));
  } finally {
    // Sends to Sentry the event of the command, whatever its outcome (see SentryService)
    await app.close();
  }
}
