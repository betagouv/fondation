import { Module } from '@nestjs/common';
import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module';
import { IngestCliModule } from './modules/ingest/ingest-cli.module';
import { AuthCliModule } from './modules/simple-auth/infrastructure/cli/auth-cli.module';

@Module({
  imports: [AppModule, AuthCliModule, IngestCliModule],
})
class CliAppModule {}

cli().catch(console.error);

async function cli() {
  await CommandFactory.run(CliAppModule, {
    logger: ['verbose', 'debug', 'log', 'warn', 'error', 'fatal'],
    errorHandler(error) {
      console.error('ERROR', error);
      process.exit(1);
    },
  });
}
