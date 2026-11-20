import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Inject, Injectable, Logger } from '@nestjs/common';
import z from 'zod';

import { PrismaSeverityEnum } from '../../../../generated/prisma/enums';
import {
  countMagistratDeactivationsRawQuery,
  insertMagistratRawQuery,
  updateMagistratStatusesRawQuery,
} from '../../../../generated/prisma/sql';
import { API_CONFIG_TOKEN, ApiConfig } from '../../../framework/config';
import { Db } from '../../../framework/database';
import { Tchap } from '../../../framework/tchap';
import { isIncompleteExtraction } from '../../domain/incomplete-extraction';
import { LolfiJob } from '../lolfi-job.type';

import { JobFileIngestor } from './job-file-ingestor';
import { RawLolfiDate } from './lolfi-ingestor.util';

@Injectable()
export class LolfiMagistratsIngestor {
  private readonly logger = new Logger(LolfiMagistratsIngestor.name);

  constructor(
    private readonly ingestor: JobFileIngestor,
    private readonly db: Db,
    private readonly tchap: Tchap,
    @Inject(API_CONFIG_TOKEN) private readonly config: ApiConfig,
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
    // Read from the file rather than from the inserted rows: a magistrat rejected for an unknown grade, position or POSAD stays active
    let presentExternalIds: string[] | undefined;

    // oxlint-disable-next-line require-yield
    async function* mapper(source: AsyncIterable<{ data: RawMagistrat; success: boolean }>) {
      const messages: { entityId: string; severity: PrismaSeverityEnum; text: string }[] = [];
      const accumulator: RawMagistrat[] = [];
      const ids = new Set<number>();

      for await (const { data } of source) {
        if (ids.has(data.id)) {
          self.logger.warn(`Magistrat "${data.id}" is duplicated. Ignored`);
          messages.push({
            entityId: String(data.id),
            severity: 'WARNING',
            text: 'plusieurs occurrences dans le fichier, seule la première est enregistrée',
          });
          continue;
        }

        ids.add(data.id);
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

      presentExternalIds = Array.from(ids, String);
      ids.clear();
    }

    const { success } = await this.ingestor.ingest({
      mapper,
      tag: 'magistrats',
      schema: RawMagistratSchema,
      job: options.job,
      file: options.file,
      // An unchanged file is skipped without being read: the statuses of its last import still hold
      beforeSucceeding: async () => {
        if (!mappingResult.success || !presentExternalIds) return undefined;

        const held = await this.applyStatuses(presentExternalIds);
        if (held) await this.alertIncompleteExtraction(options.job.id, held);

        return held;
      },
    });

    return { success: success && mappingResult.success };
  }

  /** @returns what to tell of an extraction held incomplete, whose departures are then left out */
  @Transactional()
  private async applyStatuses(presentExternalIds: string[]): Promise<string | undefined> {
    const [counts] = await this.db.tx.$queryRawTyped(countMagistratDeactivationsRawQuery(presentExternalIds));
    const magistrats = { active: counts?.active ?? 0, deactivations: counts?.deactivations ?? 0 };
    const isIncomplete = isIncompleteExtraction(magistrats, this.config.lolfi.maxDeactivationRatio);

    await this.db.tx.$queryRawTyped(updateMagistratStatusesRawQuery(presentExternalIds, !isIncomplete));

    return isIncomplete
      ? `MAGISTRATS.xml : ${magistrats.deactivations} des ${magistrats.active} magistrats actifs sont absents de l'extraction, leurs départs ne sont pas appliqués et le fichier sera relu au prochain import`
      : undefined;
  }

  /** Sent at each import until the extraction is whole again or the threshold raised: nothing else settles it */
  private async alertIncompleteExtraction(jobId: number, message: string): Promise<void> {
    this.logger.warn(message);
    await this.tchap.alert({
      text: `${message}\n\n${this.config.frontendOriginUrl}/admin/ingestions/${jobId}`,
      title: '🚨 Extraction LOLFI incomplète',
    });
  }

  @Transactional(Propagation.RequiresNew)
  private async flush(props: {
    fileId: string;
    items: RawMagistrat[];
    jobId: number;
    messages: { entityId: string; severity: PrismaSeverityEnum; text: string }[];
    result: { success: boolean };
  }) {
    try {
      const messages = [...props.messages];

      if (props.items.length > 0) {
        const unknown = await this.db.tx.$queryRawTyped(insertMagistratRawQuery(props.items));

        for (const u of unknown) {
          const entityId = u.id;
          if (!entityId) continue;

          const error =
            u.unknownGrade !== null
              ? `grade "${u.unknownGrade}" inconnu`
              : u.unknownPositionId !== null
                ? `poste actuel "${u.unknownPositionId}" inconnu`
                : u.unknownAdminPosition !== null
                  ? `position administrative "${u.unknownAdminPosition}" inconnue`
                  : u.unknownPrevAdminPosition !== null
                    ? `position administrative précédente "${u.unknownPrevAdminPosition}" inconnue`
                    : u.unknownPrevAdminPosition2 !== null
                      ? `position administrative avant-précédente "${u.unknownPrevAdminPosition2}" inconnue`
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
      this.logger.error(`Failed flushing MAGISTRATS.xml chunk`, error);
      props.result.success = false;
    } finally {
      props.messages.length = 0;
      props.items.length = 0;
    }
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
      error: ({ input }) => `date au format JJ/MM/AA attendue, "${input}" reçu`,
    })
    .transform((x) => {
      const [date, month, year] = x.split('/');
      return new Date(`19${year}-${month}-${date}`);
    })
    .pipe(z.date())
    .nullable(),
});

type RawMagistrat = z.infer<typeof RawMagistratSchema>;
