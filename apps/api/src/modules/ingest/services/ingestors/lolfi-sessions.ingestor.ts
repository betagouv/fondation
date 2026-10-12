import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';
import z from 'zod';

import { LolfiJob } from '../lolfi-job.type';
import { insertLolfiSessionRawQuery } from 'src/generated/prisma/sql';
import { Db } from 'src/modules/framework/database';

import { JobFileIngestor } from './job-file-ingestor';
import { RawLolfiDate } from './lolfi-ingestor.util';

@Injectable()
export class LolfiSessionsIngestor {
  private readonly logger = new Logger(LolfiSessionsIngestor.name);

  constructor(
    private readonly ingestor: JobFileIngestor,
    private readonly db: Db,
  ) {}

  handles(file: LolfiJob['files'][number]): boolean {
    return file.name === 'SESSIONS.xml';
  }

  async ingest(options: {
    job: Pick<LolfiJob, 'id'>;
    file: LolfiJob['files'][number];
  }): Promise<{ success: boolean }> {
    const self = this; // oxlint-disable-line @typescript-eslint/no-this-alias
    const mappingResult = { success: true };

    // oxlint-disable-next-line require-yield
    async function* mapper(source: AsyncIterable<{ data: RawSession; success: boolean }>) {
      const accumulator: RawSession[] = [];
      const ids = new Set<number>();
      for await (const { data, success } of source) {
        if (ids.has(data.num_session)) {
          self.logger.warn(`SESSIONS.xml ${data.num_session} is duplicated. Ignoring`);
          continue;
        }

        ids.add(data.num_session);
        if (success) accumulator.push(data);
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
      tag: 'sessions',
      schema: RawSessionSchema,
      job: options.job,
      file: options.file,
    });

    return { success: success && mappingResult.success };
  }

  @Transactional()
  private flush(props: { items: RawSession[]; jobId: number; fileId: string; result: { success: boolean } }) {
    return this.db.tx.$queryRawTyped(insertLolfiSessionRawQuery(props.items)).catch((error) => {
      this.logger.error(`Failed flushing SESSIONS.xml chunk`, error);
      props.result.success = false;
    });
  }
}

const RawSessionSchema = z.object({
  num_session: z.coerce.number().int().gte(0).lte(2_147_483_647),
  libelle: z.string().trim().nonempty().nullable(),
  date_publication: RawLolfiDate,
});

export type RawSession = z.infer<typeof RawSessionSchema>;
