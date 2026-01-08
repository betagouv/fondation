import { buffer } from 'node:stream/consumers';

import { Logger } from '@nestjs/common';
import { CommandRunner, SubCommand } from 'nest-commander';

import { MaintenanceService } from '../maintenance.service';

@SubCommand({ name: 'magistrats' })
export class IngestMagistratsCliCommand extends CommandRunner {
  private readonly logger = new Logger(IngestMagistratsCliCommand.name);

  constructor(private readonly maintenance: MaintenanceService) {
    super();
  }

  async run() {
    this.logger.debug('Reading MAGISTRATS.XML from STDIN');
    const xmlBuffer = await buffer(process.stdin);

    if (xmlBuffer.length === 0) {
      throw new Error('Could not read MAGISTRATS.XML from stdin');
    }

    this.logger.debug(`Read ${xmlBuffer.byteLength} bytes from MAGISTRATS.XML`);

    const start = performance.now();

    this.logger.debug('Ingesting magistrats...');
    const { updated } = await this.maintenance.ingestXmlMagistrats(xmlBuffer);

    const duration = performance.now() - start;
    this.logger.warn(
      `${updated} magistrats updated in ${duration.toFixed(2)}ms`,
    );

    // Force exit since nest-commander doesn't close properly
    process.exit(0);
  }
}
