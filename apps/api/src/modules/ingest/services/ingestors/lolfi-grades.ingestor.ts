import z from 'zod';

import { Injectable, Logger } from '@nestjs/common';
import { inspect } from 'node:util';
import { insertGradesRawQuery } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';
import { LolfiJob } from '../lolfi-job.type';
import { JobFileIngestor } from './job-file-ingestor';

@Injectable()
export class LolfiGradesIngestor {
  private readonly logger = new Logger(LolfiGradesIngestor.name);

  constructor(
    private readonly ingestor: JobFileIngestor,
    private readonly prisma: PrismaService,
  ) {}

  handles(file: LolfiJob['files'][number]): boolean {
    return file.name === 'GRADES.xml';
  }

  async ingest(options: {
    job: Pick<LolfiJob, 'id'>;
    file: LolfiJob['files'][number];
  }): Promise<{ success: boolean }> {
    const self = this; // eslint-disable-line @typescript-eslint/no-this-alias
    const mappingResult = { success: true };

    async function* mapper(
      source: AsyncIterable<{ data: RawGrade; success: boolean }>,
    ) {
      const grades = new Map<string, ExtractedGrade>();
      const massGrades = new Map<string, ExtractedMessGrade>();

      for await (const { data, success } of source) {
        if (!success) continue;

        const { grade, libelle, tri, masse_grade, mg_libelle, mg_tri } = data;
        grades.set(grade, { grade, libelle, tri, masse_grade });

        if (massGrades.has(masse_grade)) continue;
        massGrades.set(masse_grade, { masse_grade, mg_libelle, mg_tri });
      }

      await self.flush({
        grades,
        massGrades,
        fileId: options.file.id,
        jobId: options.job.id,
        result: mappingResult,
      });
    }

    const { success } = await this.ingestor.ingest({
      mapper,
      tag: 'grade',
      schema: RawGradeSchema,
      job: options.job,
      file: options.file,
    });

    return { success: success && mappingResult.success };
  }

  private flush(props: {
    grades: Map<string, ExtractedGrade>;
    massGrades: Map<string, ExtractedMessGrade>;
    jobId: number;
    fileId: string;
    result: { success: boolean };
  }) {
    return this.prisma
      .$transaction(async (tx) => {
        const unknownMassGrades = await tx.$queryRawTyped(
          insertGradesRawQuery([
            ...props.massGrades
              .values()
              .map((x) => ({ ...x, masse_grade: null })),

            ...props.grades.values(),
          ]),
        );

        if (unknownMassGrades.length === 0) return;

        await tx.ingestionJobFileError.createMany({
          data: unknownMassGrades.map(({ grade, massGrade }) => ({
            jobId: props.jobId,
            fileId: props.fileId,
            entityId: grade,
            error: `Masse grade inconnu: "${massGrade}"`,
          })),
        });
      })
      .catch((error) => {
        this.logger.error(
          `Failed flushing GRADES.xml chunk: ${inspect(error)}`,
          error instanceof Error ? error.stack : undefined,
          { error },
        );
        props.result.success = false;
      });
  }
}

const RawGradeSchema = z.object({
  grade: z.string().trim().nonempty(),
  libelle: z.string().trim().nonempty(),
  tri: z.coerce.number().int().gte(-32_768).lte(32_767),

  masse_grade: z.string().trim().nonempty(),
  mg_libelle: z.string().trim().nonempty(),
  mg_tri: z.coerce.number().int().gte(-32_768).lte(32_767),
});

type RawGrade = z.infer<typeof RawGradeSchema>;

type ExtractedGrade = Pick<
  RawGrade,
  'grade' | 'libelle' | 'tri' | 'masse_grade'
>;
type ExtractedMessGrade = Pick<
  RawGrade,
  'masse_grade' | 'mg_libelle' | 'mg_tri'
>;
