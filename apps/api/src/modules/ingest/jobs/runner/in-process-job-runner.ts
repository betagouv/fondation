import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { IngestService } from '../../infrastructure/ingest.service';
import { ignoreAsync } from 'src/utils/promises';

/** @warning this is intended for tests */
@Injectable()
export class InProcessJobRunner implements OnModuleInit, OnApplicationShutdown {
  private ingestor: IngestService;

  private readonly logger = new Logger(InProcessJobRunner.name);
  private readonly controller = new AbortController();

  constructor(private readonly modules: ModuleRef) {}

  async runDetached(jobId: number): Promise<{ toJSON(): unknown }> {
    ignoreAsync(() => this.run(jobId));
    return { toJSON: () => ({ type: 'fr.csm.fondation.jobs.inprocess.metadata' }) };
  }

  private async run(jobId: number): Promise<void> {
    const { success } = await this.ingestor.ingestLolfiFiles(jobId, this.controller.signal).catch((e) => {
      this.logger.error(`job failed`, e);
      return { success: false };
    });

    if (!success) {
      this.logger.warn(`job #${jobId} failed`);
    }
  }

  onModuleInit() {
    this.ingestor = this.modules.get(IngestService, { strict: false });
  }

  onApplicationShutdown() {
    this.controller.abort();
  }
}
