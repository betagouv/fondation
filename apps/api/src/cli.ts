import { Module } from '@nestjs/common';
import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module';
import { AuthCliModule } from './modules/simple-auth/infrastructure/cli/auth-cli.module';

@Module({ imports: [AppModule, AuthCliModule] })
class CliAppModule {}

cli().catch(console.error);
async function cli() {
  await CommandFactory.run(CliAppModule);
}
