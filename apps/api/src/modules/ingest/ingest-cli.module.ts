import {
  ConflictException,
  Logger,
  Module,
  NotFoundException,
} from '@nestjs/common';
import { Command, CommandRunner, Option } from 'nest-commander';
import z from 'zod';
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
        const result = await this.ingestor.ingestLolfiFiles(
          options.jobId,
          signal,
        );
        success = result.success;
      } catch (error) {
        if (error instanceof NotFoundException) {
          this.logger.warn(`Could not find #${options.jobId}`);
        } else if (error instanceof ConflictException) {
          this.logger.warn(`Another job is already running`);
        }

        success = false;
      }

      if (!success) throw new Error(`#${options.jobId} failed`);
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

@Module({
  imports: [IngestModule],
  providers: [IngestLolfiCommand],
})
export class IngestCliModule {}
