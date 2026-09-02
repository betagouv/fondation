import { Injectable, Logger } from '@nestjs/common';
import z from 'zod';

import { LolfiJob } from '../lolfi-job.type';
import { insertCandidatesRawQuery } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';

import { JobFileIngestor } from './job-file-ingestor';
import { LOLFI_FLUSH_TRANSACTION, RawLolfiDate } from './lolfi-ingestor.util';

@Injectable()
export class LolfiCandidatsIngestor {
  private readonly logger = new Logger(LolfiCandidatsIngestor.name);

  constructor(
    private readonly ingestor: JobFileIngestor,
    private readonly prisma: PrismaService,
  ) {}

  handles(file: LolfiJob['files'][number]): boolean {
    return file.name === 'CANDIDATS.xml';
  }

  async ingest(options: {
    job: Pick<LolfiJob, 'id'>;
    file: LolfiJob['files'][number];
  }): Promise<{ success: boolean }> {
    const self = this; // oxlint-disable-line @typescript-eslint/no-this-alias
    const mappingResult = { success: true };

    // oxlint-disable-next-line require-yield
    async function* mapper(source: AsyncIterable<{ data: RawCandidate; success: boolean }>) {
      const errors: { entityId: string; error: string }[] = [];
      const accumulator: RawCandidate[] = [];
      const ids = new Set<number>();

      for await (const { data } of source) {
        if (ids.has(data.num_candidat)) {
          self.logger.warn(`Candidate "${data.num_candidat}" is duplicated. Ignored`);
          errors.push({
            entityId: String(data.num_candidat),
            error: `Candidat "${data.num_candidat}" dupliqué. La première occurrence est la seule sauvegardée`,
          });
          continue;
        }

        ids.add(data.num_candidat);
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
      tag: 'candidats',
      schema: RawCandidateSchema,
      job: options.job,
      file: options.file,
    });

    return { success: success && mappingResult.success };
  }

  private flush(props: {
    items: RawCandidate[];
    errors: { entityId: string; error: string }[];
    jobId: number;
    fileId: string;
    result: { success: boolean };
  }) {
    return this.prisma
      .$transaction(async (tx) => {
        const errors = [...props.errors];

        if (props.items.length > 0) {
          const unknown = await tx.$queryRawTyped(insertCandidatesRawQuery(props.items));

          for (const u of unknown) {
            const entityId = u.id;
            if (!entityId) continue;

            const error =
              u.unknownMagistratId !== null
                ? `Magistrat "${u.unknownMagistratId}" inconnu`
                : u.unknownSessionId !== null
                  ? `Session observée "${u.unknownSessionId}" inconnue`
                  : null;

            if (!error) continue;

            errors.push({ entityId: String(entityId), error });
          }
        }

        if (errors.length > 0) {
          await tx.ingestionJobFileError.createMany({
            data: errors.map(({ entityId, error }) => ({
              error,
              entityId,
              jobId: props.jobId,
              fileId: props.fileId,
            })),
          });
        }
      }, LOLFI_FLUSH_TRANSACTION)
      .catch((error) => {
        this.logger.error(`Failed flushing CANDIDATS.xml chunk`, error);

        props.result.success = false;
      })
      .finally(() => {
        props.errors.length = 0;
        props.items.length = 0;
      });
  }
}

const RawCandidateSchema = z.object({
  id: z.coerce.number().int().gt(0),
  num_candidat: z.coerce.number().int().gt(0),
  demande_conjointe: z.union([z.literal('0'), z.literal('1')]).transform((x) => x === '1'),
  nom_ville_conjoint: z.string().trim().nonempty().nullable(),
  observation: z.string().trim().nonempty().nullable(),
  date_modification: RawLolfiDate,
  adr1: z.string().trim().nonempty().nullable(),
  adr2: z.string().trim().nonempty().nullable(),
  codepos: z.string().trim().nonempty().nullable(),
  ville: z.string().trim().nonempty().nullable(),
  tel_perso: z.string().trim().nonempty().nullable(),
  mandat: z.string().trim().nonempty().nullable(),
  mandat_conjoint: z.string().trim().nonempty().nullable(),
  prof_conjoint: z.string().trim().nonempty().nullable(),
  article_l111: z.string().trim().nonempty().nullable(),
  obs_num_session: z.coerce.number().int().gt(0).nullable(),
});

type RawCandidate = z.infer<typeof RawCandidateSchema>;
