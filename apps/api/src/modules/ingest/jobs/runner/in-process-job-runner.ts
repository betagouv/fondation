import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { LolfiFilesIngestor } from '../../services/ingestors/lolfi-files.ingestor';
import { ignoreAsync } from 'src/utils/promises';

/** @warning this is intended for tests */
@Injectable()
export class InProcessJobRunner implements OnApplicationShutdown {
  private readonly logger = new Logger(InProcessJobRunner.name);
  private readonly controller = new AbortController();

  constructor(private readonly modules: ModuleRef) {}

  async runDetached(jobId: number): Promise<{ toJSON(): unknown }> {
    ignoreAsync(() => this.run(jobId));
    return { toJSON: () => ({ type: 'fr.csm.fondation.jobs.inprocess.metadata' }) };
  }

  private async run(jobId: number): Promise<void> {
    /** @warning this is to prevent circular dependencies crash in tests */
    const ingestor = this.modules.get(LolfiFilesIngestor, { strict: false });

    const { success } = await ingestor.ingest(jobId, this.controller.signal).catch((e) => {
      this.logger.error(`job failed`, e);
      return { success: false };
    });

    if (!success) {
      this.logger.warn(`job #${jobId} failed`);
    }
  }

  onApplicationShutdown() {
    this.controller.abort();
  }
}
