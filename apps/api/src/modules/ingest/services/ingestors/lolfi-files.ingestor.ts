import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/modules/framework/database';
import { isDefined } from 'src/utils/is-defined';
import { LolfiJob } from '../lolfi-job.type';
import { dag } from './dag';
import { LolfiTypeJuridictionIngestor } from './lolfi-type-juridiction.ingestor';

@Injectable()
export class LolfiFileIngestor {
  private readonly logger = new Logger(LolfiFileIngestor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly typeJuridictionIngestor: LolfiTypeJuridictionIngestor,
  ) {}

  async ingest(jobId: number) {
    const [lastSucceededJob, currentJob] = await this.prisma.$transaction(
      async (tx) => {
        const runningJob = await tx.ingestionJob.findFirst({
          where: { status: 'RUNNING' },
          select: { startedAt: true, id: true },
        });

        if (isDefined(runningJob)) {
          this.logger.error(
            `Job #${runningJob.id}, started at ${runningJob.startedAt} and is not done`,
          );

          throw new ConflictException();
        }

        const lastSucceededJob = await tx.ingestionJob.findFirst({
          orderBy: { endedAt: 'desc' },
          where: { status: 'SUCCEEDED' },
          select: {
            files: {
              select: {
                fileSha256: true,
                file: { select: { id: true, name: true } },
              },
            },
          },
        });

        const currentJob = await tx.ingestionJob.findUnique({
          where: { id: jobId, status: 'IDLE' },
          select: {
            id: true,
            files: {
              select: {
                fileSha256: true,
                requirements: { select: { requiredFileId: true } },
                file: { select: { id: true, name: true } },
              },
            },
          },
        });

        return [lastSucceededJob, currentJob];
      },
    );

    if (!currentJob) throw new NotFoundException();

    const lastHashByName = new Map<string, string>(
      (lastSucceededJob?.files ?? []).map(({ file, fileSha256 }) => [
        file.name,
        fileSha256,
      ]),
    );

    const files = dag(currentJob.files);
    const lolfiJob: LolfiJob = {
      id: currentJob.id,
      files: files.map(({ file, fileSha256 }) => ({
        id: file.id,
        name: file.name,
        sha256: fileSha256,
        lastSha256: lastHashByName.get(file.name),
      })),
    };

    const result = { success: true };
    for (const file of lolfiJob.files) {
      let runResult: { success: boolean } = { success: true };
      if (this.typeJuridictionIngestor.handles(file)) {
        runResult = await this.typeJuridictionIngestor.ingest(lolfiJob);
      }

      if (runResult && !runResult.success) result.success = false;
    }

    return result;
  }
}
