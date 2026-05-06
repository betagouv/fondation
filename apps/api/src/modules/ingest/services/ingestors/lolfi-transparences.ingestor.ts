import z from 'zod';

import { Injectable, Logger } from '@nestjs/common';
import { insertNominationRawQuery } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';
import { LolfiJob } from '../lolfi-job.type';
import { JobFileIngestor } from './job-file-ingestor';
import { RawLolfiDate } from './lolfi-ingestor.util';

@Injectable()
export class LolfiTransparencesIngestor {
  private readonly logger = new Logger(LolfiTransparencesIngestor.name);

  constructor(
    private readonly ingestor: JobFileIngestor,
    private readonly prisma: PrismaService,
  ) {}

  handles(file: LolfiJob['files'][number]): boolean {
    return file.name === 'TRANSPARENCES.xml';
  }

  async ingest(options: {
    job: Pick<LolfiJob, 'id'>;
    file: LolfiJob['files'][number];
  }): Promise<{ success: boolean }> {
    const self = this; // eslint-disable-line @typescript-eslint/no-this-alias
    const mappingResult = { success: true };

    // oxlint-disable-next-line require-yield
    async function* mapper(
      source: AsyncIterable<{ data: RawNomination; success: boolean }>,
    ) {
      const errors: { entityId: string; error: string }[] = [];
      const accumulator: RawNomination[] = [];
      const ids = new Set<number>();

      for await (const { data } of source) {
        if (ids.has(data.num_transparence)) {
          self.logger.warn(
            `Nomination "${data.num_transparence}" is duplicated. Ignored`,
          );
          errors.push({
            entityId: String(data.num_transparence),
            error: `Transparence "${data.num_transparence}" dupliquée. La première occurrence est la seule sauvegardée`,
          });
          continue;
        }

        ids.add(data.num_transparence);
        accumulator.push(data);

        if (accumulator.length >= 500) {
          await self.flush({
            errors,
            items: accumulator,
            fileId: options.file.id,
            jobId: options.job.id,
            result: mappingResult,
          });
        }
      }

      if (accumulator.length > 0 || errors.length > 0) {
        await self.flush({
          errors,
          items: accumulator,
          fileId: options.file.id,
          jobId: options.job.id,
          result: mappingResult,
        });
      }

      ids.clear();
    }

    const { success } = await this.ingestor.ingest({
      mapper,
      tag: 'transparences',
      schema: RawNominationSchema,
      job: options.job,
      file: options.file,
    });

    return { success: success && mappingResult.success };
  }

  private flush(props: {
    items: RawNomination[];
    errors: { entityId: string; error: string }[];
    jobId: number;
    fileId: string;
    result: { success: boolean };
  }) {
    return this.prisma
      .$transaction(async (tx) => {
        if (props.items.length > 0) {
          const unknown = await tx.$queryRawTyped(
            insertNominationRawQuery(props.items),
          );

          if (unknown.length > 0) {
            for (const u of unknown) {
              const entityId = u.id;
              if (!entityId) continue;

              const error =
                u.unknownMagistratId !== null
                  ? `Magistrat "${u.unknownMagistratId}" inconnu`
                  : u.unknownSessionId !== null
                    ? `Session "${u.unknownSessionId}" inconnu`
                    : u.unknownTargetPositionId !== null
                      ? `Poste (<num_emploi_cible>) "${u.unknownTargetPositionId}" inconnu`
                      : u.unknownCurrentPositionId !== null
                        ? `Poste (<affectation>) ${u.unknownCurrentPositionId} inconnu`
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
        }

        if (props.errors.length > 0) {
          await tx.ingestionJobFileError.createMany({
            data: props.errors.map(({ entityId, error }) => ({
              error,
              entityId,
              jobId: props.jobId,
              fileId: props.fileId,
            })),
          });
        }
      })
      .catch((error) => {
        this.logger.error(`Failed flushing TRANSPARENCES.xml chunk`, error);
        props.result.success = false;
      })
      .finally(() => {
        props.errors.length = 0;
        props.items.length = 0;
      });
  }
}

const RawNominationSchema = z.object({
  num_transparence: z.coerce.number().int().gt(0),
  num_session: z.coerce.number().int().gt(0),
  num_emploi_cible: z.coerce.number().int().gt(0),
  type_mouvement: z
    .enum(['E', 'A'])
    .transform((x) => (x === 'A' ? 'PROMOTION' : 'EQUIVALENT')),
  ta: z.coerce.number().int().gt(1900).nullable(),
  resultat: z.coerce.number().transform((x) => x == 1),
  id: z.coerce.number().int().gt(0),
  affectation: z.coerce.number().int().gt(0),
  date_grade: RawLolfiDate.nullable(),
  tri_poste: z.coerce.number().int().gt(0),
  rang_cand: z.coerce.number().int().gt(0),
});

type RawNomination = z.infer<typeof RawNominationSchema>;
