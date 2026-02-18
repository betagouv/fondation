import { Injectable, Logger } from '@nestjs/common';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import z from 'zod';

import { inspect } from 'node:util';
import { Prisma } from 'src/generated/prisma/client';
import { Clock } from 'src/modules/framework/clock';
import { PrismaService } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { assertIsDefined } from 'src/utils/is-defined';
import { ResultBuilder } from 'src/utils/result';
import { fr } from 'zod/locales';
import { LolfiJob } from '../lolfi-job.type';
import { LolfiNode, LolfiXmlSaxParser } from '../lolfi-xml-sax-parser';

@Injectable()
export class JobFileIngestor {
  private readonly logger = new Logger(JobFileIngestor.name);

  constructor(
    private readonly clock: Clock,
    private readonly files: Files,
    private readonly prisma: PrismaService,
  ) {}

  async ingest<T>(options: {
    job: { id: number };
    file: LolfiJob['files'][number];
    tag: string;
    schema: z.ZodType<T>;
    mapper: (
      item: AsyncIterable<{ data: T; success: boolean }>,
    ) => AsyncIterable<unknown>;
  }): Promise<{ success: boolean }> {
    const parser = new LolfiXmlSaxParser({ tag: options.tag });
    z.config(fr());

    const { job, file } = options;
    try {
      const fileContentResult = await this.prisma.$transaction(
        async (tx): Promise<{ success: boolean; fileContent?: Readable }> => {
          const startedAt = this.clock.now();
          if (file.sha256 === file.lastSha256) {
            return this.succeedJobFile({ tx, file, startedAt, jobId: job.id });
          }

          await tx.ingestionJobFile.update({
            where: { primaryKey: { jobId: job.id, fileId: file.id } },
            data: { status: 'RUNNING', startedAt },
          });

          const fileContent = await this.files.getFile({
            fileId: file.id,
            tx,
          });

          if (!fileContent) {
            return this.failJobFile({
              tx,
              file,
              jobId: job.id,
              errors: [
                { error: `Impossible de récupérer le fichier "${file.name}"` },
              ],
            });
          }

          return { success: true, fileContent };
        },
      );

      if (!fileContentResult.success) return { success: false };
      if (fileContentResult.success && !fileContentResult.fileContent) {
        return { success: true };
      }

      const fileContent$ = assertIsDefined(fileContentResult.fileContent);
      const result = new ResultBuilder<
        T,
        { num: string | undefined; error: z.ZodError }
      >();

      await pipeline(
        fileContent$,
        parser,
        async function* (source: AsyncIterable<LolfiNode>) {
          for await (const item of source) {
            const jurisdictionTypeResult = await options.schema.safeParseAsync(
              Object.fromEntries(
                item.children.map(({ name, content }) => [name, content]),
              ),
            );

            if (!jurisdictionTypeResult.success) {
              const num = item.attributes['num'];
              result.fail({ num, error: jurisdictionTypeResult.error });
            } else {
              result.push(jurisdictionTypeResult.data);
              yield {
                success: result.success,
                data: jurisdictionTypeResult.data,
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
            entityId: error.num,
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
    }
  }

  private async succeedJobFile(context: {
    tx?: Prisma.TransactionClient;
    startedAt?: Date;
    jobId: number;
    file: { id: string; name: string };
  }): Promise<{ success: boolean }> {
    if (!context.tx) {
      return this.prisma.$transaction((tx) =>
        this.succeedJobFile({ ...context, tx }),
      );
    }

    return context.tx.ingestionJobFile
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
          this.logger.error(
            `Failed succeeding job #${context.jobId} ${context.file.name}: ${inspect(error)}`,
          );
          return { success: false };
        },
      );
  }

  private async failJobFile(context: {
    errors: { entityId?: string; error: string }[];
    jobId: number;
    file: { id: string; name: string };
    tx?: Prisma.TransactionClient;
  }): Promise<{ success: false }> {
    if (!context.tx) {
      return this.prisma.$transaction((tx) =>
        this.failJobFile({ ...context, tx }),
      );
    }

    this.logger.error(`${context.file.name} failed`);
    await context.tx.ingestionJobFile
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
                entityId: error.entityId,
                entityName: 'Type juridiction',
                error: error.error,
              })),
            },
          },
        },
      })
      .catch((error) => {
        this.logger.error(
          `Failed failing job #${context.jobId} ${context.file.name}: ${inspect(error)}`,
        );
      });

    return { success: false };
  }
}
