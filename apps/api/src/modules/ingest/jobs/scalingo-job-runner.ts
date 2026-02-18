import { HttpService } from '@nestjs/axios';
import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
} from '@nestjs/common';

import { inspect } from 'node:util';
import { Clock } from 'src/modules/framework/clock';
import { API_CONFIG_TOKEN, ApiConfig } from 'src/modules/framework/config';
import { PrismaService } from 'src/modules/framework/database';
import z, { ZodSafeParseResult } from 'zod';
import { FailedToCancelJob, FailedToStartJob } from './job-errors';
import { ScalingoHttpContainer } from './scalingo-http';

/** @warning prefer using {@link JobRunner} */
@Injectable()
export class ScalingoJobRunner implements OnApplicationShutdown {
  private readonly logger = new Logger(ScalingoJobRunner.name);
  private readonly scalingo: ScalingoHttpContainer | undefined;
  private readonly abortController = new AbortController();

  get isAvailable(): boolean {
    return !!this.scalingo;
  }

  constructor(
    http: HttpService,
    clock: Clock,
    private readonly prisma: PrismaService,
    @Inject(API_CONFIG_TOKEN) config: ApiConfig,
  ) {
    const { appName, apiKey } = config.scalingo;
    if (appName && apiKey) {
      this.scalingo = new ScalingoHttpContainer(
        http,
        apiKey,
        appName,
        clock,
        this.abortController,
      );
    }
  }

  /** starts the command in a "worker" scope, without creating any tunnel between this process and the other one */
  async runDetached(jobId: number): Promise<void> {
    if (!this.scalingo) {
      this.logger.error(
        `Tried running job #${jobId} with scalingo, when this runner is not available`,
      );
      throw new FailedToStartJob(jobId);
    }

    const command = `node apps/api/dist/src/cli lolfi-job --jobId ${jobId}`;
    this.logger.debug(`Starting "${command}" with scalingo job runner`);
    try {
      const result = await this.scalingo.withAuthentication((http) =>
        http.runOneOffContainer({ command }),
      );

      await this.prisma.ingestionJob
        .update({
          where: { id: jobId },
          data: {
            metadata: new ScalingoJobMetadata(result.container.id).toJSON(),
          },
        })
        .catch((error) => {
          this.logger.error(
            `Failed recording scalingo job metadata, won't be able to cancel it: ${inspect(error)}`,
            { error },
          );
        });
    } catch (error) {
      this.logger.error(
        `Failed running "${command}" with scalingo`,
        error instanceof Error ? error.stack : undefined,
        { error },
      );

      throw new FailedToStartJob(jobId, error);
    }
  }

  async cancel(jobId: number): Promise<void> {
    if (!this.scalingo) {
      this.logger.error(
        `Tried canceling job #${jobId} with scalingo, when this runner is not available`,
      );
      throw new FailedToCancelJob(jobId);
    }

    const job = await this.prisma.ingestionJob.findFirst({
      where: { id: jobId },
      select: { metadata: true },
    });
    if (!job) {
      this.logger.error(`No job #${jobId} available`);
      return;
    }

    const metadata = await ScalingoJobMetadata.from(job.metadata);
    if (!metadata.success) {
      this.logger.error(
        `Could not read metadata: ${z.formatError(metadata.error)}`,
      );
      return;
    }

    try {
      await this.scalingo.withAuthentication((http) =>
        http.sendContainerSignal({
          containerId: metadata.data.containerId,
          signal: 'SIGUSR1',
        }),
      );
    } catch (e) {
      this.logger.error(
        `Error while killing container: ${inspect(e)}`,
        e.stack,
        { error: e },
      );
    }
  }

  onApplicationShutdown() {
    this.abortController.abort();
  }
}

class ScalingoJobMetadata {
  private static readonly SCHEMA = z.object({
    type: z.literal('fr.csm.fondation.jobs.scalingo.metadata'),
    containerId: z.string().nonempty(),
  });

  constructor(readonly containerId: string) {}

  toJSON(): {
    type: 'fr.csm.fondation.jobs.scalingo.metadata';
    containerId: string;
  } {
    return {
      type: 'fr.csm.fondation.jobs.scalingo.metadata',
      containerId: this.containerId,
    };
  }

  static async from(
    data: unknown,
  ): Promise<ZodSafeParseResult<ScalingoJobMetadata>> {
    return ScalingoJobMetadata.SCHEMA.transform(
      ({ containerId }) => new ScalingoJobMetadata(containerId),
    ).safeParseAsync(data);
  }
}
