import { Injectable, Logger } from '@nestjs/common';
import { inspect } from 'node:util';
import z from 'zod';

import { PrismaService } from 'src/modules/framework/database';
import { LolfiJob } from '../lolfi-job.type';
import { JobFileIngestor } from './job-file-ingestor';

@Injectable()
export class LolfiTypeJuridictionIngestor {
  private readonly logger = new Logger(LolfiTypeJuridictionIngestor.name);

  constructor(
    private readonly ingestor: JobFileIngestor,
    private readonly prisma: PrismaService,
  ) {}

  handles(file: LolfiJob['files'][number]): boolean {
    return file.name === 'TYPE_JURIDICTION.xml';
  }

  async ingest(options: {
    job: Pick<LolfiJob, 'id'>;
    file: LolfiJob['files'][number];
  }): Promise<{ success: boolean }> {
    const self = this; // eslint-disable-line @typescript-eslint/no-this-alias
    const mappingResult = { success: true };

    async function* mapper(
      source: AsyncIterable<{ data: TypeJuridiction; success: boolean }>,
    ) {
      const accumulator: TypeJuridiction[] = [];

      for await (const { data, success } of source) {
        if (success) accumulator.push(data);

        if (accumulator.length >= 30) {
          const { success } = await self.flush(accumulator);
          if (!success) mappingResult.success = false;
          accumulator.length = 0;
        }
      }

      if (accumulator.length) {
        const { success } = await self.flush(accumulator);
        if (!success) mappingResult.success = false;
        accumulator.length = 0;
      }
    }

    const { success } = await this.ingestor.ingest({
      job: options.job,
      file: options.file,
      mapper,
      schema: TypeJuridictionSchema,
      tag: 'type_juridiction',
    });

    return { success: success && mappingResult.success };
  }

  private flush(items: readonly TypeJuridiction[]) {
    return this.prisma.$executeRaw`
      INSERT INTO "data_administration_context"."jurisdiction_type" (id, label, sort)
      SELECT
        j ->> 'type' AS "id",
        j ->> 'label' AS "label",
        (j ->> 'sort')::INT AS "sort"
      FROM UNNEST (${items}::JSONB[]) AS j

      ON CONFLICT (id) DO UPDATE SET
        "label" = EXCLUDED."label", 
        "sort" = EXCLUDED."sort";
    `.then(
      () => ({ success: true }),
      (e) => {
        this.logger.error(
          `Error while flushing TYPE_JURIDICTION: ${inspect(e)}`,
        );
        return { success: false };
      },
    );
  }
}

const TypeJuridictionSchema = z
  .object({
    type_jur: z.string().trim().nonempty(),
    libelle: z.string().trim().nonempty(),
    tri: z.coerce.number().int().gte(0),
  })
  .transform((x) => ({ type: x.type_jur, label: x.libelle, sort: x.tri }));

type TypeJuridiction = z.infer<typeof TypeJuridictionSchema>;
