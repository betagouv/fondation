import { Module } from '@nestjs/common';
import { CommandFactory } from 'nest-commander';
import { AppModule } from './app.module';
import { AuthCliModule } from './modules/simple-auth/infrastructure/cli/auth-cli.module';
import { MaintenanceCliModule } from './modules/maintenance/infrastructure/cli/maintenance-cli.module';

@Module({ imports: [AppModule, AuthCliModule, MaintenanceCliModule] })
class CliAppModule {}

cli().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function cli() {
  await CommandFactory.run(CliAppModule);
}
