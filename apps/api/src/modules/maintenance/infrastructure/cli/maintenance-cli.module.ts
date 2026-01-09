import { forwardRef, Module } from '@nestjs/common';
import { Command, CommandRunner } from 'nest-commander';

import { MaintenanceModule } from '../../maintenance.module';
import { IngestMagistratsCliCommand } from './ingest-magistrats.cli';

@Command({ name: 'ingest', subCommands: [IngestMagistratsCliCommand] })
export class IngestCliCommand extends CommandRunner {
  async run() {}
}

@Module({
  imports: [forwardRef(() => MaintenanceModule)],
  providers: [IngestCliCommand, IngestMagistratsCliCommand],
})
export class MaintenanceCliModule {}
