import { inspect } from 'node:util';

import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { ConflictException, forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { dag } from '../../domain/requirements';
import { LolfiJob } from '../lolfi-job.type';
import { Prisma } from 'src/generated/prisma/client';
import { Clock } from 'src/modules/framework/clock';
import { Db } from 'src/modules/framework/database';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';
import { DateOnly } from 'src/utils/date-only';
import { isDefined } from 'src/utils/is-defined';

import { LolfiCandidatsIngestor } from './lolfi-candidats.ingestor';
import { LolfiDesiderataIngestor } from './lolfi-desiderata.ingestor';
import { LolfiFonctionsIngestor } from './lolfi-fonctions.ingestor';
import { LolfiGradesIngestor } from './lolfi-grades.ingestor';
import { LolfiJuridictionIngestor } from './lolfi-juridiction.ingestor';
import { LolfiMagistratsIngestor } from './lolfi-magistrats.ingestor';
import { LolfiPosadsIngestor } from './lolfi-posads.ingestor';
import { LolfiPostesIngestor } from './lolfi-postes.ingestor';
import { LolfiSessionsIngestor, RawSession } from './lolfi-sessions.ingestor';
import { LolfiTransparencesIngestor } from './lolfi-transparences.ingestor';
import { LolfiTypeJuridictionIngestor } from './lolfi-type-juridiction.ingestor';

@Injectable()
export class LolfiFilesIngestor {
  private readonly logger = new Logger(LolfiFilesIngestor.name);

  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
    private readonly typeJuridictionIngestor: LolfiTypeJuridictionIngestor,
    private readonly juridictionIngestor: LolfiJuridictionIngestor,
    private readonly gradeIngestor: LolfiGradesIngestor,
    private readonly functionsIngestor: LolfiFonctionsIngestor,
    private readonly pausesIngestor: LolfiPosadsIngestor,
    private readonly positionsIngestor: LolfiPostesIngestor,
    private readonly sessionsIngestor: LolfiSessionsIngestor,
    private readonly magistratIngestor: LolfiMagistratsIngestor,
    private readonly candidatesIngestor: LolfiCandidatsIngestor,
    private readonly candidateWishesIngestor: LolfiDesiderataIngestor,
    private readonly nominationsIngestor: LolfiTransparencesIngestor,
    @Inject(forwardRef(() => TransparenceService))
    private readonly sessions: TransparenceService,
  ) {}

  async ingest(jobId: number, signal: AbortSignal): Promise<{ success: boolean; values?: RawSession[] }> {
    try {
      const { success, values } = await this.ingestInternal(jobId, signal);

      if (signal.aborted) return { success: true };

      if (!success) {
        await this.failJob(jobId);
        return { success };
      }

      await this.succeedJob(jobId);
      if (values) {
        await this.sessions
          .internalIngestLolfiSessions(
            values.map((s) => ({
              name: s.libelle,
              id: s.num_session,
              creationDate: DateOnly.fromUtcDate(s.date_publication),
            })),
          )
          .catch((err) => {
            this.logger.error(`error while creating sessions`, err);
          });
      }

      return { success };
    } catch (e) {
      if (e instanceof ConflictException || e instanceof NotFoundException) {
        throw e;
      }

      await this.failJob(jobId, e);
      return { success: false };
    }
  }

  @Transactional(Propagation.RequiresNew)
  private async succeedJob(jobId: number): Promise<void> {
    await this.db.tx.ingestionJob
      .update({
        where: { id: jobId, status: 'RUNNING' },
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
    await this.db.tx.ingestionJob
      .update({
        where: { id: jobId, status: 'RUNNING' },
        data: { status: 'FAILED', endedAt: this.clock.now() },
      })
      .catch((updateError) => {
        this.logger.error(`Failed failing job #${jobId}`, updateError);
      });

    if (!error) return;

    await this.db.tx.ingestionJobError
      .create({ data: { jobId, error: inspect(error) } })
      .catch((createError) => {
        this.logger.error(`Failed recording the error of job #${jobId}`, createError);
      });
  }

  private async ingestInternal(
    jobId: number,
    signal: AbortSignal,
  ): Promise<{ success: boolean; values?: RawSession[] }> {
    const [lastSucceededJob, currentJob] = await this.db
      .withTransaction(async () => {
        const runningJob = await this.db.tx.ingestionJob.findFirst({
          where: { status: 'RUNNING' },
          select: { id: true },
        });

        if (isDefined(runningJob)) {
          this.logger.error(`Job #${runningJob.id} is not done`);

          throw new ConflictException();
        }

        const lastSucceededJob = await this.db.tx.ingestionJob.findFirst({
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

        const currentJob = await this.db.tx.ingestionJob.update({
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

        return [lastSucceededJob, currentJob] as const;
      })
      .catch((e): never => {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
          throw new NotFoundException(undefined, { cause: e });
        }

        throw e;
      });

    const lastHashByName = new Map<string, string>(
      (lastSucceededJob?.files ?? []).map(({ file, fileSha256 }) => [file.name, fileSha256]),
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

    const result: { success: boolean; values?: RawSession[] } = {
      success: true,
    };
    for (const file of job.files) {
      if (signal.aborted) {
        await this.cancel(jobId).catch(() => {});
        result.success = true;
        return result;
      }

      const runResult = await this.ingestFile({ file, job });
      if (!runResult.success) result.success = false;
      if ('values' in runResult) result.values = runResult.values;
    }

    return result;
  }

  private ingestFile(props: {
    job: { id: number };
    file: LolfiJob['files'][number];
  }): Promise<{ success: boolean } | { success: true; values: RawSession[] }> {
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

    if (this.nominationsIngestor.handles(props.file)) {
      return this.nominationsIngestor.ingest(props);
    }

    if (this.candidatesIngestor.handles(props.file)) {
      return this.candidatesIngestor.ingest(props);
    }

    if (this.candidateWishesIngestor.handles(props.file)) {
      return this.candidateWishesIngestor.ingest(props);
    }

    return Promise.resolve({ success: true });
  }

  private async cancel(jobId: number) {
    try {
      await this.db.tx.ingestionJob.updateMany({
        data: { status: 'CANCELED', endedAt: this.clock.now() },
        where: {
          id: jobId,
          status: { notIn: ['FAILED', 'SUCCEEDED', 'CANCELED'] },
        },
      });

      await this.db.tx.ingestionJobFile.updateMany({
        where: { status: 'IDLE', jobId },
        data: { status: 'CANCELED' },
      });
    } catch (e) {
      this.logger.error(`Failed to write job as canceled`, e);
    }
  }
}
