import { Injectable, Logger } from '@nestjs/common';
import type { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import z from 'zod';

import { inspect } from 'node:util';
import { Prisma } from 'src/generated/prisma/client';
import { Clock } from 'src/modules/framework/clock';
import { PrismaService } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { ResultBuilder } from 'src/utils/result';
import { LolfiJob, LolfiJobFileNotFoundError } from '../lolfi-job.type';
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
    job: LolfiJob;
    fileName: string;
    tag: string;
    schema: z.ZodType<T>;
    mapper: (
      item: AsyncIterable<{ data: T; success: boolean }>,
    ) => AsyncIterable<unknown>;
  }): Promise<{ success: boolean }> {
    const file = options.job.files.find(
      (file) => file.name === options.fileName,
    );

    if (!file) {
      throw new LolfiJobFileNotFoundError(options.fileName);
    }

    const parser = new LolfiXmlSaxParser({ tag: options.tag });

    const { job } = options;
    try {
      const fileContentResult = await this.prisma.$transaction(
        async (
          tx,
        ): Promise<
          | { success: false }
          | { success: true }
          | { success: true; fileContent: Readable }
        > => {
          const startedAt = this.clock.now();
          if (file.sha256 === file.lastSha256) {
            await tx.ingestionJobFile.update({
              where: { primaryKey: { jobId: job.id, fileId: file.id } },
              data: { status: 'SUCCEEDED', startedAt, endedAt: startedAt },
            });

            return { success: true };
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
            await this.failJobFile({
              tx,
              file,
              jobId: job.id,
              errors: [
                { error: `Impossible de récupérer le fichier "${file.name}"` },
              ],
            });

            return { success: false };
          }

          return { success: true, fileContent };
        },
      );

      if (!fileContentResult.success) return { success: false };
      if (fileContentResult.success && !('fileContent' in fileContentResult)) {
        return { success: true };
      }

      const fileContent$ = fileContentResult.fileContent;
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
        await this.prisma.ingestionJobFile.update({
          data: { status: 'SUCCEEDED', endedAt: this.clock.now() },
          where: { primaryKey: { jobId: job.id, fileId: file.id } },
        });
      } else {
        await this.failJobFile({
          file,
          jobId: job.id,
          errors: result.errors.map((error) => ({
            entityId: error.num,
            error: z.prettifyError(error.error),
          })),
        });
      }

      return { success: result.success };
    } catch (e) {
      await this.failJobFile({
        file,
        jobId: job.id,
        errors: [{ error: `Erreur technique: ${inspect(e)}` }],
      });
      return { success: false };
    }
  }

  private async failJobFile(context: {
    errors: { entityId?: string; error: string }[];
    jobId: number;
    file: { id: string; name: string };
    tx?: Prisma.TransactionClient;
  }): Promise<void> {
    if (!context.tx) {
      return this.prisma.$transaction((tx) =>
        this.failJobFile({ ...context, tx }),
      );
    }

    this.logger.error(`${context.file.name} failed`);
    await context.tx.ingestionJobFile.update({
      where: { primaryKey: { jobId: context.jobId, fileId: context.file.id } },
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
    });
  }
}
