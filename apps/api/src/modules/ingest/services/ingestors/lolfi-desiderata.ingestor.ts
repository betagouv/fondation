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
      const messages: { entityId: string; severity: PrismaSeverityEnum; text: string }[] = [];
      const accumulator: RawCandidateWish[] = [];
      const ids = new Set<number>();

      for await (const { data } of source) {
        if (ids.has(data.num_desiderata)) {
          self.logger.warn(`Wish "${data.num_desiderata}" is duplicated. Ignored`);
          messages.push({
            entityId: String(data.num_desiderata),
            severity: 'WARNING',
            text: 'plusieurs occurrences dans le fichier, seule la première est enregistrée',
          });
          continue;
        }

        ids.add(data.num_desiderata);
        accumulator.push(data);

        if (accumulator.length >= 500) {
          await self.flush({
            fileId: options.file.id,
            items: accumulator,
            jobId: options.job.id,
            messages,
            result: mappingResult,
          });
        }
      }

      if (accumulator.length > 0 || messages.length > 0) {
        await self.flush({
          fileId: options.file.id,
          items: accumulator,
          jobId: options.job.id,
          messages,
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
    fileId: string;
    items: RawCandidateWish[];
    jobId: number;
    messages: { entityId: string; severity: PrismaSeverityEnum; text: string }[];
    result: { success: boolean };
  }) {
    try {
      const messages = [...props.messages];

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

          messages.push({ entityId: String(entityId), severity: 'ERROR', text: error });
        }
      }

      if (messages.length > 0) {
        await this.db.tx.ingestionJobFileMessage.createMany({
          data: messages.map(({ entityId, severity, text }) => ({
            entityId,
            fileId: props.fileId,
            jobId: props.jobId,
            severity,
            text,
          })),
        });
      }
    } catch (error) {
      this.logger.error(`Failed flushing DESIDERATA.xml chunk`, error);
      props.result.success = false;
    } finally {
      props.messages.length = 0;
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
