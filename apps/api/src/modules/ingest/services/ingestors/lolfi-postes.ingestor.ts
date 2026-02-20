import z from 'zod';

import { Injectable, Logger } from '@nestjs/common';
import { inspect } from 'node:util';
import { insertPositionsRawQuery } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';
import { LolfiJob } from '../lolfi-job.type';
import { JobFileIngestor } from './job-file-ingestor';

@Injectable()
export class LolfiPostesIngestor {
  private readonly logger = new Logger(LolfiPostesIngestor.name);

  constructor(
    private readonly ingestor: JobFileIngestor,
    private readonly prisma: PrismaService,
  ) {}

  handles(file: LolfiJob['files'][number]): boolean {
    return file.name === 'POSTES_2.xml';
  }

  async ingest(options: {
    job: Pick<LolfiJob, 'id'>;
    file: LolfiJob['files'][number];
  }): Promise<{ success: boolean }> {
    const self = this; // eslint-disable-line @typescript-eslint/no-this-alias
    const mappingResult = { success: true };

    async function* mapper(
      source: AsyncIterable<{ data: RawPosition; success: boolean }>,
    ) {
      const accumulator: RawPosition[] = [];
      const ids = new Set<number>();

      for await (const { data, success } of source) {
        if (!success) continue;

        if (ids.has(data.num_emploi_cible)) {
          this.logger.warn(
            `Position "${data.num_emploi_cible}" is duplicated. Ignored`,
          );
          continue;
        }

        ids.add(data.num_emploi_cible);
        accumulator.push(data);

        if (accumulator.length >= 500) {
          await self.flush({
            items: accumulator,
            fileId: options.file.id,
            jobId: options.job.id,
            result: mappingResult,
          });
        }
      }

      if (accumulator.length > 0) {
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
      tag: 'postes_2',
      schema: RawPositionSchema,
      job: options.job,
      file: options.file,
    });

    return { success: success && mappingResult.success };
  }

  private flush(props: {
    items: RawPosition[];
    jobId: number;
    fileId: string;
    result: { success: boolean };
  }) {
    return this.prisma
      .$transaction(async (tx) => {
        const unknown = await tx.$queryRawTyped(
          insertPositionsRawQuery(props.items),
        );

        if (unknown.length > 0) {
          for (const u of unknown) {
            const entityId = u.id;
            if (!entityId) continue;

            const error =
              u.unknownFunctionId !== null
                ? `Fonction "${u.unknownFunctionId}" inconnue`
                : u.unknownGradeId !== null
                  ? `Grade "${u.unknownFunctionId}" inconnu`
                  : u.unknownJurisdictionId !== null
                    ? `Juridiction "${u.unknownJurisdictionId}" inconnue`
                    : u.unknownJurisdictionTypeId !== null
                      ? `Type de juridiction "${u.unknownJurisdictionTypeId}" inconnue`
                      : null;
            if (!error) continue;

            await tx.ingestionJobFileError.create({
              data: {
                error,
                entityId: String(entityId),
                fileId: props.fileId,
                jobId: props.jobId,
              },
            });
          }
        }
      })
      .catch((error) => {
        this.logger.error(
          `Failed flushing POSTES_2.xml chunk: ${inspect(error)}`,
          error instanceof Error ? error.stack : undefined,
          { error },
        );
        props.result.success = false;
      })
      .finally(() => {
        props.items.length = 0;
      });
  }
}

const RawPositionSchema = z.object({
  num_emploi_cible: z.coerce.number().int().gte(0).lte(2_147_483_647),
  profil: z.string().trim().nonempty().nullable(),
  abrev_profil: z.string().trim().nonempty().nullable(),
  bbis: z
    .union([z.literal('0'), z.literal('1')])
    .nullable()
    .transform((x) => (x === '1' ? true : false))
    .catch(false),

  codejur: z.string().trim().nonempty(),
  type_jur: z.string().trim().nonempty(),
  masse_grade: z.string().trim().nonempty(),
  fonction: z.string().trim().nonempty().nullable(),
});

type RawPosition = z.infer<typeof RawPositionSchema>;
