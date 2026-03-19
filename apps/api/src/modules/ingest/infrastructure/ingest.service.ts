import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { inspect } from 'node:util';
import { Prisma } from 'src/generated/prisma/client';
import { Clock } from 'src/modules/framework/clock';
import { PrismaService } from 'src/modules/framework/database';
import { withLolfiFileRequirements } from '../domain/requirements';
import { JobRunner } from '../jobs';
import { LolfiFilesIngestor } from '../services/ingestors/lolfi-files.ingestor';
import {
  IngestedLolfiArchive,
  IngestedLolfiArchiveFailed,
  LolfiArchiveIngestor,
} from '../services/lolfi-archive-ingest';
import {
  DetailedLolfiSession,
  InternalDetailsLolfiSessionQuery,
} from './queries/internal-details-lolfi-session.query';

@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);

  constructor(
    private readonly clock: Clock,
    private readonly jobs: JobRunner,
    private readonly prisma: PrismaService,
    private readonly lolfiArchiveIngestor: LolfiArchiveIngestor,
    private readonly lolfiFilesIngestor: LolfiFilesIngestor,
    private readonly internalDetailsLolfiSessionQuery: InternalDetailsLolfiSessionQuery,
  ) {}

  async ingestLolfiFiles(
    jobId: number,
    signal: AbortSignal,
  ): Promise<{ success: boolean }> {
    return this.lolfiFilesIngestor.ingest(jobId, signal);
  }

  async ingestLolfiArchive(
    archive: Buffer,
    options: { type: string | undefined },
  ): Promise<
    | { id: number; status: 'STARTED' }
    | {
        id: number;
        status: 'FAILED';
        errors: (
          | IngestedLolfiArchiveFailed
          | { type: 'Unknown'; message: string }
        )[];
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
    const result = await this.lolfiArchiveIngestor.ingest(archive, options);

    return this.prisma.$transaction(async (tx) => {
      const jobId = await this.prepareJob({ tx, result, start });

      if (!result.success) {
        return { id: jobId, status: 'FAILED', errors: result.errors };
      }

      try {
        // TODO: check that starting a detached one-off is fast enough to fit in the Tx timeout
        const metadata = await this.jobs.runDetached(jobId);
        await tx.ingestionJob
          .update({
            where: { id: jobId },
            data: { metadata: metadata.toJSON() },
          })
          .catch((error) => {
            this.logger.error(
              `Failed recording metadata for job #${jobId}`,
              error,
            );
          });
      } catch (e) {
        await tx.ingestionJob
          .update({
            where: { id: jobId },
            data: {
              status: 'FAILED',
              errors: { create: { error: inspect(e) } },
            },
          })
          .catch((prismaError) => {
            this.logger.error(`Failed failing job #${jobId}`, prismaError);
          });

        return {
          id: jobId,
          status: 'FAILED',
          errors: [{ type: 'Unknown', message: `Erreur technique` }],
        };
      }

      return { id: jobId, status: 'STARTED' };
    });
  }

  private async prepareJob(props: {
    start: Date;
    result: IngestedLolfiArchive;
    tx: Prisma.TransactionClient;
  }): Promise<number> {
    const now = this.clock.now();
    const job = await props.tx.ingestionJob.create({
      select: { id: true },
      data: props.result.success
        ? { status: 'IDLE' }
        : { status: 'FAILED', startedAt: props.start, endedAt: now },
    });

    if (props.result.success) {
      await props.tx.ingestionJobFile.createMany({
        data: props.result.data.map((file) => ({
          jobId: job.id,
          fileId: file.id,
          fileSha256: file.sha256,
          status: 'IDLE',
        })),
      });

      for (const file of withLolfiFileRequirements(props.result.data)) {
        await props.tx.ingestionJobRequirement.createMany({
          data: file.requirements.map(({ requiredFileId }) => ({
            jobId: job.id,
            jobFileId: file.id,
            requiredFileId: requiredFileId,
          })),
        });
      }
    } else {
      await props.tx.ingestionJobError.createMany({
        data: props.result.errors.map(({ message }) => ({
          jobId: job.id,
          error: message,
        })),
      });
    }

    return job.id;
  }

  internalDetailsLolfiSession(
    sessionId: number,
  ): Promise<DetailedLolfiSession> {
    return this.internalDetailsLolfiSessionQuery.handle(sessionId);
  }
}
