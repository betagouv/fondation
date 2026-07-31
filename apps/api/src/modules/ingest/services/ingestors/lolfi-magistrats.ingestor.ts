import { Injectable, Logger } from '@nestjs/common';
import z from 'zod';

import { LolfiJob } from '../lolfi-job.type';
import { insertMagistratRawQuery } from 'src/generated/prisma/sql';
import { Db } from 'src/modules/framework/database';

import { JobFileIngestor } from './job-file-ingestor';
import { RawLolfiDate } from './lolfi-ingestor.util';

@Injectable()
export class LolfiMagistratsIngestor {
  private readonly logger = new Logger(LolfiMagistratsIngestor.name);

  constructor(
    private readonly ingestor: JobFileIngestor,
    private readonly db: Db,
  ) {}

  handles(file: LolfiJob['files'][number]): boolean {
    return file.name === 'MAGISTRATS.xml';
  }

  async ingest(options: {
    job: Pick<LolfiJob, 'id'>;
    file: LolfiJob['files'][number];
  }): Promise<{ success: boolean }> {
    const self = this; // oxlint-disable-line @typescript-eslint/no-this-alias
    const mappingResult = { success: true };

    // oxlint-disable-next-line require-yield
    async function* mapper(source: AsyncIterable<{ data: RawMagistrat; success: boolean }>) {
      const errors: { entityId: string; error: string }[] = [];
      const accumulator: RawMagistrat[] = [];
      const ids = new Set<number>();

      for await (const { data } of source) {
        if (ids.has(data.id)) {
          self.logger.warn(`Magistrat "${data.id}" is duplicated. Ignored`);
          errors.push({
            entityId: String(data.id),
            error: `Magistrat "${data.id}" dupliqué. La première occurrence est la seule sauvegardée`,
          });
          continue;
        }

        ids.add(data.id);
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
      tag: 'magistrats',
      schema: RawMagistratSchema,
      job: options.job,
      file: options.file,
    });

    return { success: success && mappingResult.success };
  }

  private flush(props: {
    items: RawMagistrat[];
    errors: { entityId: string; error: string }[];
    jobId: number;
    fileId: string;
    result: { success: boolean };
  }) {
    return this.db
      .withTransaction(async () => {
        if (props.items.length > 0) {
          const unknown = await this.db.tx.$queryRawTyped(insertMagistratRawQuery(props.items));

          if (unknown.length > 0) {
            for (const u of unknown) {
              const entityId = u.id;
              if (!entityId) continue;

              const error =
                u.unknownGrade !== null
                  ? `Grade "${u.unknownGrade}" inconnu`
                  : u.unknownPositionId !== null
                    ? `Poste "${u.unknownPositionId}" inconnu`
                    : u.unknownAdminPosition !== null
                      ? `POSAD (<posad>) "${u.unknownAdminPosition}" inconnue`
                      : u.unknownPrevAdminPosition !== null
                        ? `POSAD (<posad_prev>) "${u.unknownPrevAdminPosition}" inconnue`
                        : u.unknownPrevAdminPosition2 !== null
                          ? `POSAD (<posad_prev2>) "${u.unknownPrevAdminPosition2}" inconnue`
                          : null;

              if (!error) continue;

              await this.db.tx.ingestionJobFileError.create({
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
          await this.db.tx.ingestionJobFileError.createMany({
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
        this.logger.error(`Failed flushing MAGISTRATS.xml chunk`, error);
        props.result.success = false;
      })
      .finally(() => {
        props.errors.length = 0;
        props.items.length = 0;
      });
  }
}

const RawMagistratSchema = z.object({
  id: z.coerce.number().int().gte(1),
  civilite: z.string(),
  nom: z.string().trim().nonempty(),
  prenom: z.string().trim().nonempty(),
  nom_marital: z.string().trim().nonempty().nullable(),
  nom_usage: z.string().trim().nonempty().nullable().catch(null),
  sit_fam: z.string().trim().nonempty().nullable(),
  email_pro: z.string().trim().nonempty().nullable(),
  date_naiss: RawLolfiDate.nullable(),
  lieu_naiss: z.string().trim().nonempty().nullable(),
  dep_naiss: z.string().trim().nonempty().nullable(),
  grade: z
    .string()
    .trim()
    .nonempty()
    .nullable()
    // both presidents have this unknown grade...
    .transform((x) => (x === 'G3cc' ? 'G3sup' : x)),
  date_grade: RawLolfiDate.nullable(),
  num_emploi_cible: z.string().trim().nonempty().nullable(),
  date_installation: RawLolfiDate.nullable(),
  date_nomination: RawLolfiDate.nullable(),
  tableau: z
    .union([RawLolfiDate, z.coerce.number().int()])
    .transform((x) => (x instanceof Date ? x.getUTCFullYear() : x)),
  historique: z.string().trim().nonempty().nullable(),
  posad: z.string().trim().nonempty().nullable(),
  posad_prev: z.string().trim().nonempty().nullable(),
  date_posad_prev: RawLolfiDate.nullable(),
  posad_prev2: z.string().trim().nonempty().nullable(),
  date_posad_prev2: RawLolfiDate.nullable(),
  date_modification: RawLolfiDate.nullable(),

  date_posad_prev_fin: z
    .string()
    .trim()
    /** @warning this is NOT a RawLolfiDate */
    .regex(/\d\d\/\d\d\/\d\d/, {
      error: ({ input }) => `DD/MM/YY attendu vs. "${input}"`,
    })
    .transform((x) => {
      const [date, month, year] = x.split('/');
      return new Date(`19${year}-${month}-${date}`);
    })
    .pipe(z.date())
    .nullable(),
});

type RawMagistrat = z.infer<typeof RawMagistratSchema>;
