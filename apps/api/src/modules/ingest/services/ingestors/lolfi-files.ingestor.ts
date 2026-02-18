import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { inspect } from 'node:util';

import { Prisma } from 'src/generated/prisma/client';
import { Clock } from 'src/modules/framework/clock';
import { PrismaService } from 'src/modules/framework/database';
import { isDefined } from 'src/utils/is-defined';

import { LolfiJob } from '../lolfi-job.type';
import { dag } from './dag';
import { LolfiJuridictionIngestor } from './lolfi-juridiction.ingestor';
import { LolfiTypeJuridictionIngestor } from './lolfi-type-juridiction.ingestor';

@Injectable()
export class LolfiFilesIngestor {
  private readonly logger = new Logger(LolfiFilesIngestor.name);

  constructor(
    private readonly clock: Clock,
    private readonly prisma: PrismaService,
    private readonly typeJuridictionIngestor: LolfiTypeJuridictionIngestor,
    private readonly juridictionIngestor: LolfiJuridictionIngestor,
  ) {}

  async ingest(
    jobId: number,
    signal: AbortSignal,
  ): Promise<{ success: boolean }> {
    try {
      const { success } = await this.ingestInternal(jobId, signal);

      if (signal.aborted) return { success: true };

      if (success) await this.succeedJob(jobId);
      else await this.failJob(jobId);

      return { success };
    } catch (e) {
      /** @see https://docs.prisma.io/docs/orm/reference/prisma-client-reference#return-type-4 */
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        this.logger.error(
          `Could not find job #${jobId}: ${inspect(e)}`,
          e.stack,
          { error: e },
        );

        throw new NotFoundException(undefined, { cause: e });
      }

      if (e instanceof ConflictException) throw e;

      await this.failJob(jobId, e);
      return { success: false };
    }
  }

  private async succeedJob(jobId: number): Promise<void> {
    await this.prisma.ingestionJob
      .update({
        where: { id: jobId },
        data: {
          status: 'SUCCEEDED',
          endedAt: this.clock.now(),
        },
      })
      .catch((error) => {
        this.logger.error(
          `Failed succeeding job #${jobId}: ${inspect(error)}`,
          error instanceof Error ? error.stack : undefined,
          { error },
        );
      });
  }

  private async failJob(jobId: number, error?: unknown): Promise<void> {
    await this.prisma.ingestionJob
      .update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          endedAt: this.clock.now(),
          errors: error ? { create: { error: inspect(error) } } : undefined,
        },
      })
      .catch((error) => {
        this.logger.error(
          `Failed failing job #${jobId}: ${inspect(error)}`,
          error instanceof Error ? error.stack : undefined,
          { error },
        );
      });
  }

  private async ingestInternal(
    jobId: number,
    signal: AbortSignal,
  ): Promise<{ success: boolean }> {
    const [lastSucceededJob, currentJob] = await this.prisma.$transaction(
      async (tx) => {
        const runningJob = await tx.ingestionJob.findFirst({
          where: { status: 'RUNNING' },
          select: { id: true },
        });

        if (isDefined(runningJob)) {
          this.logger.error(`Job #${runningJob.id} is not done`);

          throw new ConflictException();
        }

        const lastSucceededJob = await tx.ingestionJob.findFirst({
          orderBy: { endedAt: 'desc' },
          where: { status: 'SUCCEEDED' },
          select: {
            files: {
              select: {
                fileSha256: true,
                file: { select: { id: true, name: true } },
              },
            },
          },
        });

        const currentJob = await tx.ingestionJob.update({
          where: { id: jobId, status: 'IDLE' },
          data: { status: 'RUNNING', startedAt: this.clock.now() },
          select: {
            id: true,
            files: {
              where: { status: 'IDLE' },
              select: {
                fileSha256: true,
                requirements: { select: { requiredFileId: true } },
                file: { select: { id: true, name: true } },
              },
            },
          },
        });

        return [lastSucceededJob, currentJob];
      },
    );

    const lastHashByName = new Map<string, string>(
      (lastSucceededJob?.files ?? []).map(({ file, fileSha256 }) => [
        file.name,
        fileSha256,
      ]),
    );

    const files = dag(currentJob.files);
    const job: LolfiJob = {
      id: currentJob.id,
      files: files.map(({ file, fileSha256 }) => ({
        id: file.id,
        name: file.name,
        sha256: fileSha256,
        lastSha256: lastHashByName.get(file.name),
      })),
    };

    const result = { success: true };
    for (const file of job.files) {
      if (signal.aborted) {
        await this.cancel(jobId).catch(() => {});
        result.success = true;
        return result;
      }

      let runResult: { success: boolean } = { success: true };
      if (this.typeJuridictionIngestor.handles(file)) {
        runResult = await this.typeJuridictionIngestor.ingest({ file, job });
      }

      if (this.juridictionIngestor.handles(file)) {
        runResult = await this.juridictionIngestor.ingest({ file, job });
      }

      if (!runResult.success) result.success = false;
    }

    return result;
  }

  private async cancel(jobId: number) {
    await this.prisma
      .$transaction(async (tx) => {
        await tx.ingestionJobFile.updateMany({
          where: { status: 'IDLE', jobId },
          data: { status: 'CANCELED' },
        });

        await tx.ingestionJob.updateMany({
          data: { status: 'CANCELED', endedAt: this.clock.now() },
          where: {
            id: jobId,
            status: { notIn: ['FAILED', 'SUCCEEDED', 'CANCELED'] },
          },
        });
      })
      .catch((e) => {
        this.logger.error(
          `Failed to write job as canceled: ${inspect(e)}`,
          e instanceof Error ? e.stack : undefined,
          { error: e },
        );
      });
  }
}
