import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';
import z from 'zod';

import { LolfiJob } from '../lolfi-job.type';
import { insertFunctionsRawQuery } from 'src/generated/prisma/sql';
import { Db } from 'src/modules/framework/database';
import { formationEnumToPrismaFormationEnum } from 'src/modules/shared/mappers/formation.mapper';

import { JobFileIngestor } from './job-file-ingestor';

@Injectable()
export class LolfiFonctionsIngestor {
  private readonly logger = new Logger(LolfiFonctionsIngestor.name);

  constructor(
    private readonly ingestor: JobFileIngestor,
    private readonly db: Db,
  ) {}

  handles(file: LolfiJob['files'][number]): boolean {
    return file.name === 'FONCTIONS.xml';
  }

  async ingest(options: {
    job: Pick<LolfiJob, 'id'>;
    file: LolfiJob['files'][number];
  }): Promise<{ success: boolean }> {
    const self = this; // oxlint-disable-line @typescript-eslint/no-this-alias
    const mappingResult = { success: true };

    // oxlint-disable-next-line require-yield
    async function* mapper(source: AsyncIterable<{ data: RawFunction; success: boolean }>) {
      const accumulator: RawFunction[] = [];

      for await (const { data, success } of source) {
        if (!success) continue;
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
      tag: 'fonctions',
      schema: RawFunctionSchema,
      job: options.job,
      file: options.file,
    });

    return { success: success && mappingResult.success };
  }

  @Transactional()
  private flush(props: {
    items: RawFunction[];
    jobId: number;
    fileId: string;
    result: { success: boolean };
  }) {
    return this.db.tx.$queryRawTyped(insertFunctionsRawQuery(props.items)).catch((error) => {
      this.logger.error(`Failed flushing FONCTIONS.xml chunk`, error);
      props.result.success = false;
    });
  }
}

const RawFunctionSchema = z.object({
  fonction: z.string().trim().nonempty(),
  libelle: z.string().trim().nonempty(),
  tri: z.coerce.number().int().gte(-32_768).lte(32_767),
  lieufc: z
    .union([z.literal('0'), z.literal('1'), z.literal('2')], {
      error: (iss) => `0, 1 ou 2 attendu. ${JSON.stringify(iss.input)} fourni`,
    })
    .transform((x) =>
      x === '0' ? null : formationEnumToPrismaFormationEnum(x === '1' ? 'SIEGE' : 'PARQUET'),
    ),

  fonction_m: z.string().trim().nonempty().nullable(),
  fonction_mp: z.string().trim().nonempty().nullable(),
  fonction_f: z.string().trim().nonempty().nullable(),
  fonction_fp: z.string().trim().nonempty().nullable(),
  complement: z
    .string()
    .trim()
    .nonempty()
    .nullable()
    .transform((x) => x?.replace(/:codejur/, '{codejur}') ?? null),
});

type RawFunction = z.infer<typeof RawFunctionSchema>;
