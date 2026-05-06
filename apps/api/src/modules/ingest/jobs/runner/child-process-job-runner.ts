import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
} from '@nestjs/common';
import { spawn } from 'node:child_process';
import * as path from 'node:path';
import { API_CONFIG_TOKEN, ApiConfig } from 'src/modules/framework/config';
import { isDefined } from 'src/utils/is-defined';
import z, { ZodSafeParseResult } from 'zod';
import { FailedToStartJob } from './job-errors';

/** @warning prefer using {@link JobRunner} */
@Injectable()
export class ChildProcessJobRunner implements OnApplicationShutdown {
  private readonly logger = new Logger(ChildProcessJobRunner.name);
  readonly isAvailable = true;

  private readonly isProduction: boolean = false;
  private readonly controller = new AbortController();

  constructor(@Inject(API_CONFIG_TOKEN) config: ApiConfig) {
    this.isProduction = config.isProduction;
  }

  async cancel(metadata: unknown): Promise<void> {
    const meta = await ChildProcessJobMetadata.from(metadata);
    if (!meta.success) {
      this.logger.warn(
        `Could not read metadata: ${z.prettifyError(meta.error)}`,
      );
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

  private static readonly CWD = path.resolve(__dirname, '..', '..', '..', '..');

  private spawnChildProcess(jobId: number): Promise<ChildProcessJobMetadata> {
    const commandParts = [
      'node',
      ...(this.isProduction ? [] : ['--env-file', '../../.env']),
      'cli',
      'lolfi-job',
      '--jobId',
      `${jobId}`,
    ] as const;

    const command = commandParts.join(' ');
    this.logger.debug(`Starting "${command}" with node:child_process"`);

    return new Promise<ChildProcessJobMetadata>((resolve, reject) => {
      this.logger.debug(`CWD: ${ChildProcessJobRunner.CWD}`);
      let exited = false;

      const child = spawn(commandParts[0], commandParts.slice(1), {
        detached: true,
        stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
        signal: this.controller.signal,
        cwd: ChildProcessJobRunner.CWD,
      });

      child.on('message', (msg) => {
        if (exited) return;

        this.logger.debug(`Received message: ${JSON.stringify(msg)}`);
        if (msg !== 'started') return;

        exited = true;
        child.disconnect();
        child.unref();

        if (!isDefined(child.pid)) {
          return reject(
            new FailedToStartJob(jobId, { message: `no PID available` }),
          );
        }

        resolve(new ChildProcessJobMetadata(child.pid));
      });

      child.on('spawn', () => {
        if (exited) return;

        this.logger.debug(`Spawned`);
        if (!child.pid) {
          exited = true;
          return reject(
            new FailedToStartJob(jobId, { message: `no PID available` }),
          );
        }
      });

      child.on('exit', (code, signal) => {
        if (exited) return;

        this.logger.debug(`Exited (code: ${code}, signal: ${signal})`);

        if (isDefined(code) && code !== 0) {
          exited = true;
          this.logger.error(`Child Process exited with non zero code: ${code}`);
          reject(
            new FailedToStartJob(jobId, {
              message: `exit status code: ${code}`,
            }),
          );
        }
      });

      child.on('error', (err) => {
        this.logger.error(`Error`, err);
        reject(new FailedToStartJob(jobId, { cause: err }));
      });
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
