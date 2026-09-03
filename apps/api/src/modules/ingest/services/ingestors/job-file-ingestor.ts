import { pipeline } from 'node:stream/promises';
import { inspect } from 'node:util';

import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';
import z from 'zod';
import { fr } from 'zod/locales';

import { LolfiJob } from '../lolfi-job.type';
import { LolfiNode, LolfiXmlSaxParser } from '../lolfi-xml-sax-parser';
import { Clock } from 'src/modules/framework/clock';
import { Db } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { ResultBuilder } from 'src/utils/result';

@Injectable()
export class JobFileIngestor {
  private readonly logger = new Logger(JobFileIngestor.name);

  constructor(
    private readonly clock: Clock,
    private readonly files: Files,
    private readonly db: Db,
  ) {}

  async ingest<T>(options: {
    job: { id: number };
    file: LolfiJob['files'][number];
    tag: string;
    schema: z.ZodType<T>;
    mapper: (item: AsyncIterable<{ data: T; success: boolean }>) => AsyncIterable<unknown>;
  }): Promise<{ success: boolean }> {
    let start: number;
    const { job, file } = options;
    try {
      const startedAt = this.clock.now();
      if (file.sha256 === file.lastSha256) {
        this.logger.log(`${file.name} sha256 did not change. Skipping`);

        return this.succeedJobFile({ file, startedAt, jobId: job.id });
      }

      await this.db.tx.ingestionJobFile.update({
        where: { primaryKey: { jobId: job.id, fileId: file.id } },
        data: { status: 'RUNNING', startedAt },
      });

      const fileContent$ = await this.files.getFile({ fileId: file.id });
      if (!fileContent$) {
        return this.failJobFile({
          file,
          jobId: job.id,
          errors: [{ error: `Impossible de récupérer le fichier "${file.name}"` }],
        });
      }

      const result = new ResultBuilder<T, { num: number | undefined; error: z.ZodError }>();

      start = performance.now();
      this.logger.log(`Started ingesting ${options.file.name}`);

      const parser = new LolfiXmlSaxParser({ tag: options.tag });
      z.config(fr());

      await pipeline(
        fileContent$,
        parser,
        async function* (source: AsyncIterable<LolfiNode>) {
          for await (const item of source) {
            const parseResult = await options.schema.safeParseAsync(
              Object.fromEntries(item.children.map(({ name, content }) => [name, content])),
            );

            if (!parseResult.success) {
              const num = item.attributes['num'];
              result.fail({ num: Number(num), error: parseResult.error });
            } else {
              yield {
                success: result.success,
                data: parseResult.data,
              };
            }
          }
        },
        options.mapper,
      );

      if (result.success) {
        return this.succeedJobFile({ file, jobId: job.id });
      } else {
        return this.failJobFile({
          file,
          jobId: job.id,
          errors: result.errors.map((error) => ({
            entityNumber: error.num,
            error: z.prettifyError(error.error),
          })),
        });
      }
    } catch (e) {
      return this.failJobFile({
        file,
        jobId: job.id,
        errors: [{ error: `Erreur technique: ${inspect(e)}` }],
      });
    } finally {
      const duration = start! ? (performance.now() - start).toFixed(2) : null;
      this.logger.log(`Done ingesting ${options.file.name}${duration ? ` (${duration}ms)` : ''}`);
    }
  }

  @Transactional()
  private async succeedJobFile(context: {
    startedAt?: Date;
    jobId: number;
    file: { id: string; name: string };
  }): Promise<{ success: boolean }> {
    return this.db.tx.ingestionJobFile
      .update({
        data: {
          status: 'SUCCEEDED',
          endedAt: this.clock.now(),
          startedAt: context.startedAt,
        },
        where: {
          primaryKey: { jobId: context.jobId, fileId: context.file.id },
        },
      })
      .then(
        () => ({ success: true }),
        (error) => {
          this.logger.error(`Failed succeeding job #${context.jobId} ${context.file.name}`, error);
          return { success: false };
        },
      );
  }

  @Transactional()
  private async failJobFile(context: {
    errors: { entityNumber?: number; error: string }[];
    jobId: number;
    file: { id: string; name: string };
  }): Promise<{ success: false }> {
    this.logger.error(`${context.file.name} failed`);
    await this.db.tx.ingestionJobFile
      .update({
        where: {
          primaryKey: { jobId: context.jobId, fileId: context.file.id },
        },
        data: {
          status: 'FAILED',
          endedAt: this.clock.now(),
          errors: {
            createMany: {
              data: context.errors.map((error) => ({
                entityNumber: error.entityNumber,
                error: error.error,
              })),
            },
          },
        },
      })
      .catch((error) => {
        this.logger.error(`Failed failing job #${context.jobId} ${context.file.name}`, error);
      });

    return { success: false };
  }
}
