import z from 'zod';

import { Injectable, Logger } from '@nestjs/common';
import { inspect } from 'node:util';
import { ingestLolfiJurisdictionRawQuery } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';
import { LolfiJob } from '../lolfi-job.type';
import { JobFileIngestor } from './job-file-ingestor';

@Injectable()
export class LolfiJuridictionIngestor {
  private readonly logger = new Logger(LolfiJuridictionIngestor.name);

  constructor(
    private readonly ingestor: JobFileIngestor,
    private readonly prisma: PrismaService,
  ) {}

  handles(file: LolfiJob['files'][number]): boolean {
    return file.name === 'JURIDICTION.xml';
  }

  async ingest(options: {
    job: Pick<LolfiJob, 'id'>;
    file: LolfiJob['files'][number];
  }): Promise<{ success: boolean }> {
    const self = this; // eslint-disable-line @typescript-eslint/no-this-alias
    const mappingResult = { success: true };

    async function* mapper(
      source: AsyncIterable<{ data: RawJurisdiction; success: boolean }>,
    ) {
      const accumulator: RawJurisdiction[] = [];

      for await (const { data, success } of source) {
        if (success) accumulator.push(data);

        if (accumulator.length >= 100) {
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
      tag: 'juridiction',
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
    return this.prisma
      .$transaction(async (tx) => {
        const unknownJurisdictionTypes = await tx.$queryRawTyped(
          ingestLolfiJurisdictionRawQuery(props.items),
        );

        if (unknownJurisdictionTypes.length === 0) return;

        await tx.ingestionJobFileError.createMany({
          data: unknownJurisdictionTypes.map(({ codejur, type_jur }) => ({
            jobId: props.jobId,
            fileId: props.fileId,
            entityId: codejur,
            error: `Type de juridiction inconnue: "${type_jur}"`,
          })),
        });
      })
      .catch((error) => {
        this.logger.error(
          `Failed flushing JURIDICTION.xml chunk: ${inspect(error)}`,
          error instanceof Error ? error.stack : undefined,
          { error },
        );
        props.result.success = false;
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
  date_suppression: z
    .string()
    .regex(/\d\d\/\d\d\/\d{4}/)
    .transform((x) => {
      const [date, month, year] = x.split('/');
      return new Date(`${year}-${month}-${date}`);
    })
    .nullable(),
  libelle: z.string().trim().nonempty().nullable(),
  ressort: z.string().trim().nonempty().nullable(),
  ville_jur: z.string().trim().nonempty().nullable(),
  ville: z.string().trim().nonempty().nullable(),
});

type RawJurisdiction = z.infer<typeof RawJurisdictionSchema>;
