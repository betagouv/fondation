import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { Clock } from 'src/modules/framework/clock';
import { PrismaService } from 'src/modules/framework/database';
import { JobRunner } from '../jobs/job-runner';
import {
  IngestedLolfiArchive,
  IngestedLolfiArchiveFailed,
  LolfiArchiveIngestor,
} from '../services/lolfi-archive-ingest';

@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);

  constructor(
    private readonly clock: Clock,
    private readonly jobs: JobRunner,
    private readonly prisma: PrismaService,
    private readonly lolfiArchiveIngestor: LolfiArchiveIngestor,
  ) {}

  async ingestLolfiArchive(archive: Buffer): Promise<
    | { id: number; status: 'STARTED' }
    | {
        id: number;
        status: 'FAILED';
        errors: IngestedLolfiArchiveFailed[];
      }
  > {
    const runningJobExists = await this.prisma.ingestionJob.findFirst({
      where: { status: 'RUNNING' },
      select: { id: true },
    });

    if (runningJobExists) {
      this.logger.error(`Job #${runningJobExists.id} already running`);
      throw new ConflictException();
    }

    const start = this.clock.now();

    const result = await this.lolfiArchiveIngestor.ingest(archive);
    const jobId = await this.prepareJob({ result, start });

    if (result.success) {
      await this.jobs.runDetached(
        `node apps/api/dist/cli ingest lolfi --id ${jobId}`,
      );
    }

    if (!result.success) {
      return { id: jobId, status: 'FAILED', errors: result.errors };
    }

    return { id: jobId, status: 'STARTED' };
  }

  private async prepareJob(props: {
    start: Date;
    result: IngestedLolfiArchive;
  }): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const now = this.clock.now();
      const job = await tx.ingestionJob.create({
        select: { id: true },
        data: props.result.success
          ? { status: 'IDLE', startedAt: props.start }
          : { status: 'FAILED', startedAt: props.start, endedAt: now },
      });

      if (props.result.success) {
        await tx.ingestionJobFile.createMany({
          data: props.result.data.map((file) => ({
            jobId: job.id,
            fileId: file.id,
            fileSha256: file.sha256,
            status: 'IDLE',
          })),
        });
      } else {
        await tx.ingestionJobError.createMany({
          data: props.result.errors.map(({ message }) => ({
            jobId: job.id,
            error: message,
          })),
        });
      }

      return job.id;
    });
  }
}
