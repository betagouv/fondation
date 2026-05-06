import { Injectable, Logger } from '@nestjs/common';
import z from 'zod';

import { LolfiJob } from '../lolfi-job.type';
import { insertJurisdictionTypesRawQuery } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';

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
    const self = this; // oxlint-disable-line @typescript-eslint/no-this-alias
    const mappingResult = { success: true };

    // oxlint-disable-next-line require-yield
    async function* mapper(source: AsyncIterable<{ data: TypeJuridiction; success: boolean }>) {
      const accumulator: TypeJuridiction[] = [];

      for await (const { data, success } of source) {
        if (success) accumulator.push(data);
      }

      if (accumulator.length) {
        await self.flush({
          items: accumulator,
          result: mappingResult,
        });
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

  private flush(props: { items: TypeJuridiction[]; result: { success: boolean } }) {
    return this.prisma
      .$queryRawTyped(insertJurisdictionTypesRawQuery(props.items))
      .then(
        () => ({ success: true }),
        (error) => {
          this.logger.error(`Failed flushing TYPE_JURIDICTION.xml`, error);
          props.result.success = false;
        },
      )
      .finally(() => {
        props.items.length = 0;
      });
  }
}

const TypeJuridictionSchema = z.object({
  type_jur: z.string().trim().nonempty(),
  libelle: z.string().trim().nonempty(),
  tri: z.coerce.number().int().gte(0),
});

type TypeJuridiction = z.infer<typeof TypeJuridictionSchema>;
