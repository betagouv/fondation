import { ConflictException, Logger, Module, NotFoundException } from '@nestjs/common';
import { format } from 'date-fns';
import { Command, CommandRunner, Option } from 'nest-commander';
import z from 'zod';

import { Mattermost } from 'src/modules/framework/mattermost';

import { IngestService } from './infrastructure/ingest.service';
import { IngestModule } from './ingest.module';

@Command({ name: 'lolfi-job' })
export class IngestLolfiCommand extends CommandRunner {
  private readonly logger = new Logger(IngestLolfiCommand.name);
  constructor(private readonly ingestor: IngestService) {
    super();
  }

  @Option({ flags: '--jobId <id>', name: 'jobId' })
  parseJobId(jobId: string): number {
    return z.coerce.number().int().gt(0).parse(jobId);
  }

  async run(_params: string[], options: { jobId: number }): Promise<void> {
    // if running as a child process, we notify the main process we started
    process.send?.('started');

    return IngestLolfiCommand.cancelable(async (signal) => {
      let success = true;
      try {
        const result = await this.ingestor.ingestLolfiFiles(options.jobId, signal);
        success = result.success;
      } catch (error) {
        if (error instanceof NotFoundException) {
          this.logger.warn(`Could not find #${options.jobId}`);
        } else if (error instanceof ConflictException) {
          this.logger.warn(`Another job is already running`);
        }

        success = false;
      }

      if (!success) {
        this.logger.error(`#${options.jobId} failed`);
        process.exitCode = 1;
      }
    });
  }

  private static async cancelable<T>(
    action: (signal: AbortSignal) => Promise<T>,
    signal = 'SIGUSR1',
  ): Promise<T> {
    let promise: Promise<T> | undefined = undefined;

    const abortController = new AbortController();
    async function cancelOnUSR1() {
      abortController.abort();
      if (promise) await promise;
    }

    process.once(signal, cancelOnUSR1);
    promise = action(abortController.signal).finally(() => {
      process.removeListener(signal, cancelOnUSR1);
    });

    return promise;
  }
}

@Command({ name: 'lolfi-freshness' })
export class LolfiFreshnessCommand extends CommandRunner {
  private readonly logger = new Logger(LolfiFreshnessCommand.name);

  constructor(
    private readonly ingestor: IngestService,
    private readonly mattermost: Mattermost,
  ) {
    super();
  }

  async run(): Promise<void> {
    const { stale, lastSuccessAt } = await this.ingestor.checkIngestionFreshness();
    const since = lastSuccessAt ? format(lastSuccessAt, 'dd/MM/yyyy') : 'jamais';

    if (!stale) {
      this.logger.log(`Dernière ingestion LOLFI réussie le ${since}`);
      return;
    }

    const message = `Aucune ingestion LOLFI réussie depuis le ${since}`;
    this.logger.error(message);

    await this.mattermost.alert({ title: ":alert: Ingestion LOLFI à l'arrêt", text: message });

    process.exitCode = 1;
  }
}

@Module({
  imports: [IngestModule],
  providers: [IngestLolfiCommand, LolfiFreshnessCommand],
})
export class IngestCliModule {}
