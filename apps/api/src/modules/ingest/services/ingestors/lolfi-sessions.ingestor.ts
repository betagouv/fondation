import { Transactional } from '@nestjs-cls/transactional';
import { Inject, Injectable, Logger } from '@nestjs/common';
import z from 'zod';

import { LolfiJob } from '../lolfi-job.type';
import { insertLolfiSessionRawQuery } from 'src/generated/prisma/sql';
import { API_CONFIG_TOKEN, ApiConfig } from 'src/modules/framework/config';
import { Db } from 'src/modules/framework/database';

import { JobFileIngestor } from './job-file-ingestor';
import { RawLolfiDate } from './lolfi-ingestor.util';

@Injectable()
export class LolfiSessionsIngestor {
  private readonly FLAG_ENABLE_LOLFI_SESSIONS: true | Date;
  private readonly logger = new Logger(LolfiSessionsIngestor.name);

  constructor(
    private readonly ingestor: JobFileIngestor,
    private readonly db: Db,

    @Inject(API_CONFIG_TOKEN)
    config: ApiConfig,
  ) {
    this.FLAG_ENABLE_LOLFI_SESSIONS = config.isProduction ? new Date(Date.UTC(2026, 5, 1)) : true;
  }

  handles(file: LolfiJob['files'][number]): boolean {
    return file.name === 'SESSIONS.xml';
  }

  async ingest(options: {
    job: Pick<LolfiJob, 'id'>;
    file: LolfiJob['files'][number];
  }): Promise<{ success: false } | { success: true; values: RawSession[] }> {
    const self = this; // oxlint-disable-line @typescript-eslint/no-this-alias
    const mappingResult = { success: true };

    const accumulator: RawSession[] = [];
    // oxlint-disable-next-line require-yield
    async function* mapper(source: AsyncIterable<{ data: RawSession; success: boolean }>) {
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

    const finalSuccess = success && mappingResult.success;
    if (finalSuccess) {
      return { success: true, values: this.cleanResult(accumulator) };
    }

    return { success: finalSuccess };
  }

  @Transactional()
  private flush(props: { items: RawSession[]; jobId: number; fileId: string; result: { success: boolean } }) {
    return this.db.tx.$queryRawTyped(insertLolfiSessionRawQuery(props.items)).catch((error) => {
      this.logger.error(`Failed flushing SESSIONS.xml chunk`, error);
      props.result.success = false;
    });
  }

  private cleanResult(values: readonly RawSession[]): RawSession[] {
    if (this.FLAG_ENABLE_LOLFI_SESSIONS === true) return [...values];

    const flagDate = this.FLAG_ENABLE_LOLFI_SESSIONS.getTime();
    return values.filter((value) => flagDate <= value.date_publication.getTime());
  }
}

const RawSessionSchema = z.object({
  num_session: z.coerce.number().int().gte(0).lte(2_147_483_647),
  libelle: z.string().trim().nonempty().nullable(),
  date_publication: RawLolfiDate,
});

export type RawSession = z.infer<typeof RawSessionSchema>;
