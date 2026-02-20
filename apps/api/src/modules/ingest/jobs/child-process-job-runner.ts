import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { spawn } from 'node:child_process';
import { inspect } from 'node:util';
import { PrismaService } from 'src/modules/framework/database';
import z from 'zod';
import { LolfiJob } from '../services/lolfi-job.type';
import { FailedToStartJob } from './job-errors';

/** @warning prefer using {@link JobRunner} */
@Injectable()
export class ChildProcessJobRunner implements OnApplicationShutdown {
  private readonly logger = new Logger(ChildProcessJobRunner.name);
  readonly isAvailable = true;

  private readonly controller = new AbortController();

  constructor(private readonly prisma: PrismaService) {}

  async cancel(job: LolfiJob): Promise<void> {
    const ingestionJob = await this.prisma.ingestionJob.findFirst({
      where: { id: job.id },
      select: { metadata: true },
    });

    if (!ingestionJob) return;

    const metadata = await ChildProcessJobMetadata.from(ingestionJob.metadata);
    if (!metadata) return;

    try {
      process.kill(metadata.pid, 'SIGUSR1');
    } catch {}
  }

  async runDetached(jobId: number): Promise<void> {
    const command = `node dist/src/cli lolfi-job --jobId ${jobId}`;
    this.logger.debug(`Starting "${command} with node:child_process"`);
    try {
      const child = spawn(command, {
        detached: true,
        stdio: 'ignore',
        signal: this.controller.signal,
      });

      child.on('error', (err) => {
        this.logger.error(
          `Child Process error: ${inspect(err)}`,
          err instanceof Error ? err.stack : undefined,
          { error: err },
        );
      });

      if (!child.pid) {
        throw new Error(`No PID available`);
      }

      const pid = child.pid;
      child.unref();

      const metadata = new ChildProcessJobMetadata(pid);
      await this.prisma.ingestionJob
        .update({
          where: { id: jobId },
          data: { metadata: metadata.toJSON() },
        })
        .catch((error) => {
          this.logger.error(
            `Error while recording job #${jobId} metadata, won't be able to cancel it: ${inspect(error)}`,
            error.stack,
            { error: error },
          );
        });
    } catch (error) {
      this.logger.error(
        `Failed running "${command}" with node:child_process`,
        error instanceof Error ? error.stack : undefined,
        { error },
      );

      throw new FailedToStartJob(jobId, error);
    }
  }

  onApplicationShutdown(signal?: string) {
    this.controller.abort(signal ? `Signal: ${signal}` : undefined);
  }
}

class ChildProcessJobMetadata {
  private static readonly SCHEMA = z.object({
    pid: z.number(),
    type: z.literal(`fr.csm.fondation.jobs.childprocess.metadata`),
  });

  constructor(readonly pid: number) {}

  toJSON(): {
    type: `fr.csm.fondation.jobs.childprocess.metadata`;
    pid: number;
  } {
    return {
      pid: this.pid,
      type: `fr.csm.fondation.jobs.childprocess.metadata`,
    };
  }

  static async from(data: unknown) {
    const result = await ChildProcessJobMetadata.SCHEMA.safeParseAsync(data);
    if (!result.success) return null;

    return new ChildProcessJobMetadata(result.data.pid);
  }
}
