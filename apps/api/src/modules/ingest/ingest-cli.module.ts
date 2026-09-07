import { ConflictException, Inject, Logger, Module, NotFoundException } from '@nestjs/common';
import { format } from 'date-fns';
import { Command, CommandRunner, Option } from 'nest-commander';
import z from 'zod';

import { API_CONFIG_TOKEN, ApiConfig } from 'src/modules/framework/config';
import { Mattermost } from 'src/modules/framework/mattermost';

import { IngestService } from './infrastructure/ingest.service';
import { IngestModule } from './ingest.module';

@Command({ name: 'lolfi-job' })
export class IngestLolfiCommand extends CommandRunner {
  private readonly logger = new Logger(IngestLolfiCommand.name);
  constructor(
    private readonly ingestor: IngestService,
    private readonly mattermost: Mattermost,
    @Inject(API_CONFIG_TOKEN) private readonly config: ApiConfig,
  ) {
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
      const { jobId } = options;
      let failure: string | null = null;

      try {
        const result = await this.ingestor.ingestLolfiFiles(jobId, signal);
        if (!result.success) failure = `Le job #${jobId} a échoué`;
      } catch (error) {
        if (error instanceof NotFoundException) {
          this.logger.warn(`Could not find #${jobId} or it is not idle anymore`);
          failure = `Le job #${jobId} est introuvable ou déjà traité`;
        } else if (error instanceof ConflictException) {
          this.logger.warn(`Another job is already running`);
          failure = `Le job #${jobId} n'a pas démarré, un autre job est déjà en cours`;
        } else {
          this.logger.error(`Job #${jobId} failed unexpectedly`, error);
          failure = `Le job #${jobId} a échoué`;
        }
      }

      if (!failure) return;

      this.logger.error(`#${jobId} failed`);
      await this.mattermost.alert({
        title: ':alert: Ingestion LOLFI en échec',
        text: `${failure}\n\n${this.config.frontendOriginUrl}/admin/jobs/${jobId}`,
      });

      process.exitCode = 1;
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
