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

import { dag } from '../../domain/requirements';
import { LolfiJob } from '../lolfi-job.type';
import { LolfiCandidatsIngestor } from './lolfi-candidats.ingestor';
import { LolfiFonctionsIngestor } from './lolfi-fonctions.ingestor';
import { LolfiGradesIngestor } from './lolfi-grades.ingestor';
import { LolfiJuridictionIngestor } from './lolfi-juridiction.ingestor';
import { LolfiMagistratsIngestor } from './lolfi-magistrats.ingestor';
import { LolfiPosadsIngestor } from './lolfi-posads.ingestor';
import { LolfiPostesIngestor } from './lolfi-postes.ingestor';
import { LolfiSessionsIngestor } from './lolfi-sessions.ingestor';
import { LolfiTypeJuridictionIngestor } from './lolfi-type-juridiction.ingestor';

@Injectable()
export class LolfiFilesIngestor {
  private readonly logger = new Logger(LolfiFilesIngestor.name);

  constructor(
    private readonly clock: Clock,
    private readonly prisma: PrismaService,
    private readonly typeJuridictionIngestor: LolfiTypeJuridictionIngestor,
    private readonly juridictionIngestor: LolfiJuridictionIngestor,
    private readonly gradeIngestor: LolfiGradesIngestor,
    private readonly functionsIngestor: LolfiFonctionsIngestor,
    private readonly pausesIngestor: LolfiPosadsIngestor,
    private readonly positionsIngestor: LolfiPostesIngestor,
    private readonly sessionsIngestor: LolfiSessionsIngestor,
    private readonly magistratIngestor: LolfiMagistratsIngestor,
    private readonly candidatesIngestor: LolfiCandidatsIngestor,
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
      if (e instanceof ConflictException || e instanceof NotFoundException) {
        throw e;
      }

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
        this.logger.error(`Failed succeeding job #${jobId}`, error);
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
        this.logger.error(`Failed failing job #${jobId}`, error);
      });
  }

  private async ingestInternal(
    jobId: number,
    signal: AbortSignal,
  ): Promise<{ success: boolean }> {
    const [lastSucceededJob, currentJob] = await this.prisma
      .$transaction(async (tx) => {
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
      })
      .catch((e) => {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2025'
        ) {
          throw new NotFoundException(undefined, { cause: e });
        }

        throw e;
      });

    const lastHashByName = new Map<string, string>(
      (lastSucceededJob?.files ?? []).map(({ file, fileSha256 }) => [
        file.name,
        fileSha256,
      ]),
    );

    const files = dag(currentJob.files);
    this.logger.debug('FILES:');
    this.logger.debug(files.map(({ file }) => `- ${file.name}`).join('\n'));

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

      const runResult = await this.ingestFile({ file, job });
      if (!runResult.success) result.success = false;
    }

    return result;
  }

  private ingestFile(props: {
    job: { id: number };
    file: LolfiJob['files'][number];
  }): Promise<{ success: boolean }> {
    if (this.gradeIngestor.handles(props.file)) {
      return this.gradeIngestor.ingest(props);
    }

    if (this.functionsIngestor.handles(props.file)) {
      return this.functionsIngestor.ingest(props);
    }

    if (this.pausesIngestor.handles(props.file)) {
      return this.pausesIngestor.ingest(props);
    }

    if (this.typeJuridictionIngestor.handles(props.file)) {
      return this.typeJuridictionIngestor.ingest(props);
    }

    if (this.juridictionIngestor.handles(props.file)) {
      return this.juridictionIngestor.ingest(props);
    }

    if (this.positionsIngestor.handles(props.file)) {
      return this.positionsIngestor.ingest(props);
    }

    if (this.sessionsIngestor.handles(props.file)) {
      return this.sessionsIngestor.ingest(props);
    }

    if (this.magistratIngestor.handles(props.file)) {
      return this.magistratIngestor.ingest(props);
    }

    if (this.candidatesIngestor.handles(props.file)) {
      return this.candidatesIngestor.ingest(props);
    }

    return Promise.resolve({ success: true });
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
        this.logger.error(`Failed to write job as canceled`, e);
      });
  }
}
