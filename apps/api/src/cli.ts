import './instrument';
import { Module } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { CommandFactory } from 'nest-commander';

import * as time from 'src/utils/time';

import { AppModule } from './app.module';
import { IngestCliModule } from './modules/ingest/ingest-cli.module';
import { AuthCliModule } from './modules/simple-auth/infrastructure/cli/auth-cli.module';

@Module({
  imports: [AppModule, AuthCliModule, IngestCliModule],
})
class CliAppModule {}

const SENTRY_FLUSH_TIMEOUT = 5 * time.SECONDS;

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
    errorHandler: reportAndExit,
  });
}
