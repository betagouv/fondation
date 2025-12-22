import { buffer } from 'node:stream/consumers';
import { setTimeout as wait } from 'node:timers/promises';

import { NestFactory } from '@nestjs/core';
import { INestApplicationContext, Logger } from '@nestjs/common';

import { RootModule } from '../src/modules/root.module';
import { MaintenanceService } from '../src/modules/maintenance/infrastructure/maintenance.service';

const logger = new Logger(`IngestJurisdictionsCLI`);

let app: INestApplicationContext;
Promise.race([
  main(),
  wait(60_000).then(() => {
    throw new Error(`Timeout (60s)`);
  }),
])
  .catch((err) => logger.error(err))
  .finally(async () => {
    await app.close();
    logger.debug('closed');
  });

async function main() {
  app = await NestFactory.createApplicationContext(RootModule);

  const maintenance = app.get(MaintenanceService);

  logger.debug(`Reading from STDIN`);
  const xmlBuffer = await buffer(process.stdin);
  if (xmlBuffer.length === 0) {
    throw new Error(`Could not read xml from stdin`);
  }
  logger.debug(`Read ${xmlBuffer.byteLength} bytes`);

  const start = performance.now();

  logger.debug(`Ingesting...`);
  const { updated } = await maintenance.ingestXmlJurisdictions(xmlBuffer);
  logger.warn(`${updated} updated`);

  const duration = performance.now() - start;
  logger.debug(`done ingesting xml (${duration.toFixed(2)}ms)`);
}
