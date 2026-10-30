import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';
import z from 'zod';

import { PrismaSeverityEnum } from '../../../../generated/prisma/enums';
import { insertNominationRawQuery } from '../../../../generated/prisma/sql';
import { Db } from '../../../framework/database';
import { LolfiJob } from '../lolfi-job.type';

import { JobFileIngestor } from './job-file-ingestor';
import { RawLolfiDate } from './lolfi-ingestor.util';

@Injectable()
export class LolfiTransparencesIngestor {
  private readonly logger = new Logger(LolfiTransparencesIngestor.name);

  constructor(
    private readonly ingestor: JobFileIngestor,
    private readonly db: Db,
  ) {}

  handles(file: LolfiJob['files'][number]): boolean {
    return file.name === 'TRANSPARENCES.xml';
  }

  async ingest(options: {
    job: Pick<LolfiJob, 'id'>;
    file: LolfiJob['files'][number];
  }): Promise<{ success: boolean }> {
    const self = this; // oxlint-disable-line @typescript-eslint/no-this-alias
    const mappingResult = { success: true };

    // oxlint-disable-next-line require-yield
    async function* mapper(source: AsyncIterable<{ data: RawNomination; success: boolean }>) {
      const messages: { entityId: string; severity: PrismaSeverityEnum; text: string }[] = [];
      const accumulator: RawNomination[] = [];
      const ids = new Set<number>();

      for await (const { data } of source) {
        if (ids.has(data.num_transparence)) {
          self.logger.warn(`Nomination "${data.num_transparence}" is duplicated. Ignored`);
          messages.push({
            entityId: String(data.num_transparence),
            severity: 'WARNING',
            text: 'plusieurs occurrences dans le fichier, seule la première est enregistrée',
          });
          continue;
        }

        ids.add(data.num_transparence);
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
      tag: 'transparences',
      schema: RawNominationSchema,
      job: options.job,
      file: options.file,
    });

    return { success: success && mappingResult.success };
  }

  @Transactional(Propagation.RequiresNew)
  private async flush(props: {
    fileId: string;
    items: RawNomination[];
    jobId: number;
    messages: { entityId: string; severity: PrismaSeverityEnum; text: string }[];
    result: { success: boolean };
  }) {
    try {
      const messages = [...props.messages];

      if (props.items.length > 0) {
        const unknown = await this.db.tx.$queryRawTyped(insertNominationRawQuery(props.items));

        for (const u of unknown) {
          const entityId = u.id;
          if (!entityId) continue;

          const error =
            u.unknownMagistratId !== null
              ? `magistrat "${u.unknownMagistratId}" inconnu`
              : u.unknownSessionId !== null
                ? `session "${u.unknownSessionId}" inconnue`
                : u.unknownTargetPositionId !== null
                  ? `poste visé "${u.unknownTargetPositionId}" inconnu`
                  : u.unknownCurrentPositionId !== null
                    ? `poste actuel "${u.unknownCurrentPositionId}" inconnu`
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
      this.logger.error(`Failed flushing TRANSPARENCES.xml chunk`, error);
      props.result.success = false;
    } finally {
      props.messages.length = 0;
      props.items.length = 0;
    }
  }
}

const RawNominationSchema = z.object({
  num_transparence: z.coerce.number().int().gt(0),
  num_session: z.coerce.number().int().gt(0),
  num_emploi_cible: z.coerce.number().int().gt(0),
  type_mouvement: z.enum(['E', 'A']).transform((x) => (x === 'A' ? 'PROMOTION' : 'EQUIVALENT')),
  ta: z.coerce.number().int().gt(1900).nullable(),
  resultat: z.coerce.number().transform((x) => x == 1),
  id: z.coerce.number().int().gt(0),
  affectation: z.coerce.number().int().gt(0),
  date_grade: RawLolfiDate.nullable(),
  tri_poste: z.coerce.number().int().gt(0),
  rang_cand: z.coerce.number().int().gt(0),
});

type RawNomination = z.infer<typeof RawNominationSchema>;
