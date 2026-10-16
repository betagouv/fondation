import { Propagation } from '@nestjs-cls/transactional';
import { Inject, Logger, Module } from '@nestjs/common';
import { Command, CommandRunner, Option } from 'nest-commander';

import { Prisma } from 'src/generated/prisma/client';
import { API_CONFIG_TOKEN, type ApiConfig } from 'src/modules/framework/config';
import { Db } from 'src/modules/framework/database';

import { Files } from './files';

const KNOWN_SIZES_TO_CHECK = 10;

@Command({
  description: 'copies the size known to the storage into the attachments uploaded without one',
  name: 'backfill-file-sizes',
})
export class BackfillFileSizesCommand extends CommandRunner {
  private readonly logger = new Logger(BackfillFileSizesCommand.name);

  constructor(
    private readonly db: Db,
    private readonly files: Files,
    @Inject(API_CONFIG_TOKEN) private readonly config: ApiConfig,
  ) {
    super();
  }

  @Option({ description: 'reads the storage without writing anything', flags: '--dry-run', name: 'dryRun' })
  parseDryRun(): boolean {
    return true;
  }

  async run(_inputs: string[], options: { dryRun?: boolean }): Promise<void> {
    await this.checkKnownSizes();

    const attachments = await this.db.withTransaction(Propagation.RequiresNew, () =>
      this.db.tx.file.findMany({
        select: { id: true, path: true } satisfies Prisma.FileSelect,
        where: {
          OR: [
            { attachedToNominationFiles: { some: {} } },
            { attachedToObservations: { some: {} } },
            { attachedToReports: { some: { usage: 'ATTACHMENT' } } },
            { attachedToSessions: { some: {} } },
            { attachedToSummaries: { some: {} } },
          ],
          bucket: this.config.s3.bucket,
          sizeInBytes: null,
        },
      }),
    );

    const counts = { FOUND: 0, MISSING: 0, REFUSED: 0 };

    // S3 has no batched HEAD; writing each size on its own lets a stopped run resume
    for (const attachment of attachments) {
      const stored = await this.files.storedSize(attachment);
      counts[stored.status]++;

      if (stored.status !== 'FOUND') {
        this.logger.warn(`${stored.status} ${attachment.id} ${attachment.path.join('/')}`);
        continue;
      }

      if (options.dryRun) continue;

      await this.db.withTransaction(Propagation.RequiresNew, () =>
        this.db.tx.file.update({ data: { sizeInBytes: stored.size }, where: { id: attachment.id } }),
      );
    }

    this.logger.log(
      `${options.dryRun ? 'Would update' : 'Updated'} ${counts.FOUND} of ${attachments.length} attachments, ${counts.MISSING} missing, ${counts.REFUSED} refused`,
    );
  }

  // the objects are encrypted (SSE-C): the size the storage answers is trusted once it matches the known ones
  private async checkKnownSizes(): Promise<void> {
    const known = await this.db.withTransaction(Propagation.RequiresNew, () =>
      this.db.tx.file.findMany({
        orderBy: { createdAt: 'desc' },
        select: { path: true, sizeInBytes: true } satisfies Prisma.FileSelect,
        take: KNOWN_SIZES_TO_CHECK,
        where: { bucket: this.config.s3.bucket, sizeInBytes: { not: null } },
      }),
    );

    const counts = { FOUND: 0, MISSING: 0, REFUSED: 0 };
    for (const file of known) {
      const stored = await this.files.storedSize(file);
      counts[stored.status]++;
      if (stored.status !== 'FOUND') continue;

      if (stored.size !== file.sizeInBytes) {
        throw new Error(
          `The storage answers ${stored.size} bytes for ${file.path.join('/')}, the database knows ${file.sizeInBytes}`,
        );
      }
    }

    if (counts.FOUND === 0) {
      throw new Error(
        `No known size could be checked against the storage: ${counts.MISSING} missing, ${counts.REFUSED} refused`,
      );
    }

    this.logger.log(`The storage agrees with the ${counts.FOUND} known sizes it was asked`);
  }
}

@Module({ providers: [BackfillFileSizesCommand] })
export class FilesCliModule {}
