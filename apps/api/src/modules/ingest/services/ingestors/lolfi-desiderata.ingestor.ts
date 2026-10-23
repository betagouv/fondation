import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';
import z from 'zod';

import { PrismaSeverityEnum } from '../../../../generated/prisma/enums';
import { insertCandidateWishesRawQuery } from '../../../../generated/prisma/sql';
import { Db } from '../../../framework/database';
import { LolfiJob } from '../lolfi-job.type';

import { JobFileIngestor } from './job-file-ingestor';
import { RawLolfiDate } from './lolfi-ingestor.util';

@Injectable()
export class LolfiDesiderataIngestor {
  private readonly logger = new Logger(LolfiDesiderataIngestor.name);

  constructor(
    private readonly ingestor: JobFileIngestor,
    private readonly db: Db,
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
      const errors: { entityId: string; error: string; severity: PrismaSeverityEnum }[] = [];
      const accumulator: RawCandidateWish[] = [];
      const ids = new Set<number>();

      for await (const { data } of source) {
        if (ids.has(data.num_desiderata)) {
          self.logger.warn(`Wish "${data.num_desiderata}" is duplicated. Ignored`);
          errors.push({
            entityId: String(data.num_desiderata),
            error: 'plusieurs occurrences dans le fichier, seule la première est enregistrée',
            severity: 'WARNING',
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

  @Transactional(Propagation.RequiresNew)
  private async flush(props: {
    items: RawCandidateWish[];
    errors: { entityId: string; error: string; severity: PrismaSeverityEnum }[];
    jobId: number;
    fileId: string;
    result: { success: boolean };
  }) {
    try {
      const errors = [...props.errors];

      if (props.items.length > 0) {
        const unknown = await this.db.tx.$queryRawTyped(insertCandidateWishesRawQuery(props.items));

        for (const u of unknown) {
          const entityId = u.id;
          if (!entityId) continue;

          const error =
            u.unknownCandidateId !== null
              ? `candidat "${u.unknownCandidateId}" inconnu`
              : u.unknownPositionId !== null
                ? `poste souhaité "${u.unknownPositionId}" inconnu`
                : null;

          if (!error) continue;

          errors.push({ entityId: String(entityId), error, severity: 'ERROR' });
        }
      }

      if (errors.length > 0) {
        await this.db.tx.ingestionJobFileError.createMany({
          data: errors.map(({ entityId, error, severity }) => ({
            entityId,
            error,
            fileId: props.fileId,
            jobId: props.jobId,
            severity,
          })),
        });
      }
    } catch (error) {
      this.logger.error(`Failed flushing DESIDERATA.xml chunk`, error);
      props.result.success = false;
    } finally {
      props.errors.length = 0;
      props.items.length = 0;
    }
  }
}

const RawCandidateWishSchema = z.object({
  num_desiderata: z.coerce.number().int().gt(0),
  num_candidat: z.coerce.number().int().gt(0),
  num_emploi_cible: z.coerce.number().int().gt(0),
  date_enregistrement: RawLolfiDate,
});

type RawCandidateWish = z.infer<typeof RawCandidateWishSchema>;
