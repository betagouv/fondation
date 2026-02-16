import { pipeline } from 'node:stream/promises';
import z from 'zod';

import { Clock } from 'src/modules/framework/clock';
import { PrismaService } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { ResultBuilder } from 'src/utils/result';
import { LolfiJob, LolfiJobFileNotFoundError } from '../lolfi-job.type';
import { LolfiNode, LolfiXmlSaxParser } from '../lolfi-xml-sax-parser';

export class LolfiTypeJuridictionIngestor {
  private static NAME = 'TYPE_JURIDICTION.xml';
  private readonly parser = new LolfiXmlSaxParser({ tag: 'type_juridiction' });

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

  async ingest(job: LolfiJob) {
    const file = job.files.find(
      ({ name }) => name === LolfiTypeJuridictionIngestor.NAME,
    );

    if (!file) {
      throw new LolfiJobFileNotFoundError(LolfiTypeJuridictionIngestor.NAME);
    }

    await this.prisma.$transaction(async (tx) => {
      const startedAt = this.clock.now();
      await tx.ingestionJob.update({
        where: { id: job.id, status: 'IDLE' },
        data: { status: 'RUNNING', startedAt },
      });

      if (file.sha256 === file.lastSha256) {
        await tx.ingestionJobFile.update({
          where: { primaryKey: { jobId: job.id, fileId: file.id } },
          data: { status: 'SUCCEEDED', startedAt, endedAt: startedAt },
        });

        return;
      }

      tx.ingestionJobFile.update({
        where: { primaryKey: { jobId: job.id, fileId: file.id } },
        data: { status: 'RUNNING', startedAt },
      });

      const fileContent$ = await this.files.getFile({ fileId: file.id, tx });
      if (!fileContent$) return;

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
            (j ->> sort)::INT AS "sort"
          FROM UNNEST (${result.data}::JSONB[]) AS j

          ON CONFLICT (id) DO UPDATE SET
            "label" = EXCLUDED."label", 
            "sort" = EXCLUDED."sort";
        `;
      } else {
        await tx.ingestionJobFile.update({
          data: { status: 'FAILED', endedAt: this.clock.now() },
          where: { primaryKey: { jobId: job.id, fileId: file.id } },
        });
      }
    });
  }
}
