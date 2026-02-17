import { pipeline } from 'node:stream/promises';
import z from 'zod';

import { Injectable, Logger } from '@nestjs/common';
import { inspect } from 'node:util';
import { Prisma } from 'src/generated/prisma/client';
import { Clock } from 'src/modules/framework/clock';
import { PrismaService } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { ResultBuilder } from 'src/utils/result';
import { LolfiJob, LolfiJobFileNotFoundError } from '../lolfi-job.type';
import { LolfiNode, LolfiXmlSaxParser } from '../lolfi-xml-sax-parser';

@Injectable()
export class LolfiTypeJuridictionIngestor {
  private static readonly NAME = 'TYPE_JURIDICTION.xml';
  private readonly parser = new LolfiXmlSaxParser({ tag: 'type_juridiction' });
  private readonly logger = new Logger(LolfiTypeJuridictionIngestor.name);

  private static readonly SCHEMA = z.object({
    type: z.string().trim().nonempty(),
    label: z.string().trim().nonempty(),
    sort: z.coerce.number().int().gte(0),
  });

  constructor(
    private readonly files: Files,
    private readonly clock: Clock,
    private readonly prisma: PrismaService,
  ) {}

  handles(file: LolfiJob['files'][number]): boolean {
    return file.name === LolfiTypeJuridictionIngestor.NAME;
  }

  ingest(job: LolfiJob): Promise<{ success: boolean }> {
    const file = job.files.find(this.handles);
    if (!file) {
      throw new LolfiJobFileNotFoundError(LolfiTypeJuridictionIngestor.NAME);
    }

    return this.prisma
      .$transaction(async (tx) => {
        try {
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

          const fileContent$ = await this.files.getFile({
            fileId: file.id,
            tx,
          });

          if (!fileContent$) {
            await this.failJobFile({
              jobId: job.id,
              fileId: file.id,
              errors: [
                { error: `Impossible de récupérer le fichier "${file.name}"` },
              ],
            });

            return { success: false };
          }

          const result = new ResultBuilder<
            z.infer<(typeof LolfiTypeJuridictionIngestor)['SCHEMA']>,
            { num: string | undefined; error: z.ZodError }
          >();

          await pipeline(
            fileContent$,
            this.parser,
            async function* (source: AsyncIterable<LolfiNode>) {
              for await (const item of source) {
                const jurisdictionTypeResult =
                  await LolfiTypeJuridictionIngestor.SCHEMA.safeParseAsync(
                    Object.fromEntries(
                      item.children.map(({ name, content }) => [name, content]),
                    ),
                  );

                if (!jurisdictionTypeResult.success) {
                  const num = item.attributes['num'];
                  result.fail({ num, error: jurisdictionTypeResult.error });
                } else {
                  result.push(jurisdictionTypeResult.data);
                }
              }
            },
          );

          if (result.success) {
            await tx.ingestionJobFile.update({
              data: { status: 'SUCCEEDED', endedAt: this.clock.now() },
              where: { primaryKey: { jobId: job.id, fileId: file.id } },
            });

            await tx.$executeRaw`
              INSERT INTO "data_administration_context"."jurisdiction_type" (id, label, sort)
              SELECT
                j ->> 'id' AS "id",
                j ->> 'label' AS "label",
                (j ->> 'sort')::INT AS "sort"
              FROM UNNEST (${result.data}::JSONB[]) AS j

              ON CONFLICT (id) DO UPDATE SET
                "label" = EXCLUDED."label", 
                "sort" = EXCLUDED."sort";
            `;
          } else {
            await this.failJobFile({
              tx,
              jobId: job.id,
              fileId: file.id,
              errors: result.errors.map((error) => ({
                entityId: error.num,
                error: z.prettifyError(error.error),
              })),
            });
          }

          return { success: result.success };
        } catch (e) {
          await this.failJobFile({
            tx,
            jobId: job.id,
            fileId: file.id,
            errors: [{ error: `Erreur technique: ${inspect(e)}` }],
          });
          return { success: false };
        }
      })
      .catch(
        (e): Promise<{ success: boolean }> =>
          this.failJobFile({
            jobId: job.id,
            fileId: file.id,
            errors: [{ error: `Erreur technique: ${inspect(e)}` }],
          }).then(
            () => ({ success: false }),
            (e) => {
              this.logger.error(
                `Error while failing job #${job.id} file ${file.name}: ${inspect(e)}`,
              );

              return { success: false };
            },
          ),
      );
  }

  private async failJobFile(context: {
    errors: { entityId?: string; error: string }[];
    jobId: number;
    fileId: string;
    tx?: Prisma.TransactionClient;
  }): Promise<void> {
    if (!context.tx) {
      return this.prisma.$transaction((tx) =>
        this.failJobFile({ ...context, tx }),
      );
    }

    this.logger.error(`${LolfiTypeJuridictionIngestor.NAME} failed`);
    await context.tx.ingestionJobFile.update({
      where: { primaryKey: { jobId: context.jobId, fileId: context.fileId } },
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
