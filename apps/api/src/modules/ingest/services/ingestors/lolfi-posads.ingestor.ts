import z from 'zod';

import { Injectable, Logger } from '@nestjs/common';
import { insertAdministrativePositionsRawQuery } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';
import { LolfiJob } from '../lolfi-job.type';
import { JobFileIngestor } from './job-file-ingestor';

@Injectable()
export class LolfiPosadsIngestor {
  private readonly logger = new Logger(LolfiPosadsIngestor.name);

  constructor(
    private readonly ingestor: JobFileIngestor,
    private readonly prisma: PrismaService,
  ) {}

  handles(file: LolfiJob['files'][number]): boolean {
    return file.name === 'POSADS.xml';
  }

  async ingest(options: {
    job: Pick<LolfiJob, 'id'>;
    file: LolfiJob['files'][number];
  }): Promise<{ success: boolean }> {
    const self = this; // oxlint-disable-line @typescript-eslint/no-this-alias
    const mappingResult = { success: true };

    // oxlint-disable-next-line require-yield
    async function* mapper(
      source: AsyncIterable<{ data: RawPause; success: boolean }>,
    ) {
      const accumulator: RawPause[] = [];
      const ids = new Set<string>();

      for await (const { data, success } of source) {
        if (!success) continue;

        if (ids.has(data.posad)) {
          self.logger.warn(`Pause "${data.posad}" is duplicated. Ignored`);
          continue;
        }

        ids.add(data.posad);
        accumulator.push(data);
      }

      await self.flush({
        items: accumulator,
        fileId: options.file.id,
        jobId: options.job.id,
        result: mappingResult,
      });
    }

    const { success } = await this.ingestor.ingest({
      mapper,
      tag: 'posads',
      schema: RawPauseSchema,
      job: options.job,
      file: options.file,
    });

    return { success: success && mappingResult.success };
  }

  private flush(props: {
    items: RawPause[];
    jobId: number;
    fileId: string;
    result: { success: boolean };
  }) {
    return this.prisma
      .$queryRawTyped(insertAdministrativePositionsRawQuery(props.items))
      .catch((error) => {
        this.logger.error(`Failed flushing POSADS.xml chunk`, error);
        props.result.success = false;
      });
  }
}

const RawPauseSchema = z.object({
  posad: z.string().trim().nonempty(),
  libelle: z.string().trim().nonempty().nullable(),
  reel: z
    .string()
    .regex(/^\d(?:,\d+)?$/, {
      error: ({ input }) =>
        `nombre entre 0,0 et 1,0 attendu. "${input}" fourni`,
    })
    .transform((x) => Number(x.replace(',', '.')))
    .pipe(z.number().gte(0.0).lte(1.0)),
});

type RawPause = z.infer<typeof RawPauseSchema>;
