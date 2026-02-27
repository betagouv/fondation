import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { spawn } from 'node:child_process';
import * as path from 'node:path';
import z, { ZodSafeParseResult } from 'zod';
import { FailedToStartJob } from './job-errors';

/** @warning prefer using {@link JobRunner} */
@Injectable()
export class ChildProcessJobRunner implements OnApplicationShutdown {
  private readonly logger = new Logger(ChildProcessJobRunner.name);
  readonly isAvailable = true;

  private readonly controller = new AbortController();

  async cancel(metadata: unknown): Promise<void> {
    const meta = await ChildProcessJobMetadata.from(metadata);
    if (!meta.success) {
      this.logger.warn(`Could not read metadata: ${z.formatError(meta.error)}`);
      return;
    }

    try {
      process.kill(meta.data.pid, 'SIGUSR1');
    } catch (e) {
      this.logger.warn(
        `Failed sending SIGUSR1 signal to process ${meta.data.pid}`,
        e,
      );
    }
  }

  runDetached(jobId: number): Promise<ChildProcessJobMetadata> {
    return this.spawnChildProcess(jobId).catch((err) => {
      throw err instanceof FailedToStartJob
        ? err
        : new FailedToStartJob(jobId, { cause: err });
    });
  }

  private static readonly CWD = path.resolve(__dirname, '..', '..', '..');

  private spawnChildProcess(jobId: number): Promise<ChildProcessJobMetadata> {
    const commandParts = [
      'node',
      'cli',
      'lolfi-job',
      '--jobId',
      `${jobId}`,
    ] as const;

    const command = commandParts.join(' ');
    this.logger.debug(`Starting "${command}" with node:child_process"`);

    return new Promise<ChildProcessJobMetadata>((resolve, reject) => {
      const child = spawn(commandParts[0], commandParts.slice(1), {
        detached: true,
        stdio: 'ignore',
        signal: this.controller.signal,
        cwd: ChildProcessJobRunner.CWD,
      });

      child.on('spawn', () => {
        if (!child.pid) {
          return reject(
            new FailedToStartJob(jobId, { message: `no PID available` }),
          );
        }

        resolve(new ChildProcessJobMetadata(child.pid));
      });

      child.on('error', (err) => {
        this.logger.error(`Child Process error`, err);
        reject(err);
      });

      child.unref();
    });
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

  static from(
    data: unknown,
  ): Promise<ZodSafeParseResult<ChildProcessJobMetadata>> {
    return ChildProcessJobMetadata.SCHEMA.transform(
      ({ pid }) => new ChildProcessJobMetadata(pid),
    ).safeParseAsync(data);
  }
}
