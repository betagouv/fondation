import { Injectable, Logger } from '@nestjs/common';
import z from 'zod';

import { LolfiJob } from '../lolfi-job.type';
import { insertCandidateWishesRawQuery } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';

import { JobFileIngestor } from './job-file-ingestor';
import { RawLolfiDate } from './lolfi-ingestor.util';

@Injectable()
export class LolfiDesiderataIngestor {
  private readonly logger = new Logger(LolfiDesiderataIngestor.name);

  constructor(
    private readonly ingestor: JobFileIngestor,
    private readonly prisma: PrismaService,
  ) {}

  handles(file: LolfiJob['files'][number]): boolean {
    return file.name === 'DESIDERATA.xml';
  }

  async ingest(options: {
    job: Pick<LolfiJob, 'id'>;
    file: LolfiJob['files'][number];
  }): Promise<{ success: boolean }> {
    const self = this; // oxlint-disable-line @typescript-eslint/no-this-alias
    const mappingResult = { success: true };

    // oxlint-disable-next-line require-yield
    async function* mapper(source: AsyncIterable<{ data: RawCandidateWish; success: boolean }>) {
      const errors: { entityId: string; error: string }[] = [];
      const accumulator: RawCandidateWish[] = [];
      const ids = new Set<number>();

      for await (const { data } of source) {
        if (ids.has(data.num_desiderata)) {
          self.logger.warn(`Wish "${data.num_desiderata}" is duplicated. Ignored`);
          errors.push({
            entityId: String(data.num_desiderata),
            error: `Desiderata "${data.num_desiderata}" dupliqué. La première occurrence est la seule sauvegardée`,
          });
          continue;
        }

        ids.add(data.num_desiderata);
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
      tag: 'desiderata',
      schema: RawCandidateWishSchema,
      job: options.job,
      file: options.file,
    });

    return { success: success && mappingResult.success };
  }

  private flush(props: {
    items: RawCandidateWish[];
    errors: { entityId: string; error: string }[];
    jobId: number;
    fileId: string;
    result: { success: boolean };
  }) {
    return this.prisma
      .$transaction(async (tx) => {
        if (props.items.length > 0) {
          const unknown = await tx.$queryRawTyped(insertCandidateWishesRawQuery(props.items));

          if (unknown.length > 0) {
            for (const u of unknown) {
              const entityId = u.id;
              if (!entityId) continue;

              const error =
                u.unknownCandidateId !== null
                  ? `Candidat "${u.unknownCandidateId}" inconnu`
                  : u.unknownPositionId !== null
                    ? `Poste "${u.unknownPositionId}" inconnu`
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
        this.logger.error(`Failed flushing DESIDERATA.xml chunk`, error);
        props.result.success = false;
      })
      .finally(() => {
        props.errors.length = 0;
        props.items.length = 0;
      });
  }
}

const RawCandidateWishSchema = z.object({
  num_desiderata: z.coerce.number().int().gt(0),
  num_candidat: z.coerce.number().int().gt(0),
  num_emploi_cible: z.coerce.number().int().gt(0),
  date_enregistrement: RawLolfiDate,
});

type RawCandidateWish = z.infer<typeof RawCandidateWishSchema>;
