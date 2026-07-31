import { Injectable, Logger } from '@nestjs/common';
import z from 'zod';

import { LolfiJob } from '../lolfi-job.type';
import { insertJurisdictionsRawQuery } from 'src/generated/prisma/sql';
import { Db } from 'src/modules/framework/database';

import { JobFileIngestor } from './job-file-ingestor';
import { RawLolfiDate } from './lolfi-ingestor.util';

@Injectable()
export class LolfiJuridictionIngestor {
  private readonly logger = new Logger(LolfiJuridictionIngestor.name);

  constructor(
    private readonly ingestor: JobFileIngestor,
    private readonly db: Db,
  ) {}

  handles(file: LolfiJob['files'][number]): boolean {
    return file.name === 'JURIDICTIONS.xml';
  }

  async ingest(options: {
    job: Pick<LolfiJob, 'id'>;
    file: LolfiJob['files'][number];
  }): Promise<{ success: boolean }> {
    const self = this; // oxlint-disable-line @typescript-eslint/no-this-alias
    const mappingResult = { success: true };

    // oxlint-disable-next-line require-yield
    async function* mapper(source: AsyncIterable<{ data: RawJurisdiction; success: boolean }>) {
      const accumulator: RawJurisdiction[] = [];

      for await (const { data, success } of source) {
        if (success) accumulator.push(data);

        if (accumulator.length >= 300) {
          await self.flush({
            items: accumulator,
            fileId: options.file.id,
            jobId: options.job.id,
            result: mappingResult,
          });
        }
      }

      if (accumulator.length) {
        await self.flush({
          items: accumulator,
          fileId: options.file.id,
          jobId: options.job.id,
          result: mappingResult,
        });
      }
    }

    const { success } = await this.ingestor.ingest({
      mapper,
      tag: 'juridictions',
      schema: RawJurisdictionSchema,
      job: options.job,
      file: options.file,
    });

    return { success: success && mappingResult.success };
  }

  private flush(props: {
    items: RawJurisdiction[];
    jobId: number;
    fileId: string;
    result: { success: boolean };
  }) {
    return this.db
      .withTransaction(async () => {
        const unknownJurisdictionTypes = await this.db.tx.$queryRawTyped(
          insertJurisdictionsRawQuery(props.items),
        );

        if (unknownJurisdictionTypes.length === 0) return;

        await this.db.tx.ingestionJobFileError.createMany({
          data: unknownJurisdictionTypes.map(({ codejur, type_jur }) => ({
            jobId: props.jobId,
            fileId: props.fileId,
            entityId: codejur,
            error: `Type de juridiction inconnue: "${type_jur}"`,
          })),
        });
      })
      .catch((error) => {
        this.logger.error(`Failed flushing JURIDICTION.xml chunk`, error);
        props.result.success = false;
      })
      .finally(() => {
        props.items.length = 0;
      });
  }
}

const RawJurisdictionSchema = z.object({
  codejur: z.string().trim().nonempty(),
  type_jur: z.string().trim().nonempty(),
  adr1: z.string().trim().nonempty().nullable(),
  adr2: z.string().trim().nonempty().nullable(),
  arrondissement: z.string().trim().nonempty().nullable(),
  codepos: z.string().trim().nonempty().nullable(),
  date_suppression: RawLolfiDate,
  libelle: z.string().trim().nonempty().nullable(),
  ressort: z.string().trim().nonempty().nullable(),
  ville_jur: z.string().trim().nonempty().nullable(),
  ville: z.string().trim().nonempty().nullable(),
});

type RawJurisdiction = z.infer<typeof RawJurisdictionSchema>;
