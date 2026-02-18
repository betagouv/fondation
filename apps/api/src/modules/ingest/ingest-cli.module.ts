import { Module } from '@nestjs/common';
import { Command, CommandRunner, Option } from 'nest-commander';
import z from 'zod';
import { IngestService } from './infrastructure/ingest.service';
import { IngestModule } from './ingest.module';

@Command({ name: 'lolfi-job' })
export class IngestLolfiCommand extends CommandRunner {
  constructor(private readonly ingestor: IngestService) {
    super();
  }

  @Option({ flags: '--jobId <id>', name: 'jobId' })
  parseJobId(jobId: string): number {
    return z.coerce.number().int().gt(0).parse(jobId);
  }

  async run(_params: string[], options: { jobId: number }): Promise<void> {
    const { success } = await this.ingestor.ingestLolfiFiles(options.jobId);
    if (!success) throw new Error(`#${options.jobId} failed`);
  }
}

@Module({
  imports: [IngestModule],
  providers: [IngestLolfiCommand],
})
export class IngestCliModule {}
