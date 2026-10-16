import { Propagation } from '@nestjs-cls/transactional';
import { Inject, Logger, Module } from '@nestjs/common';
import { Command, CommandRunner, Option } from 'nest-commander';

import { Prisma } from 'src/generated/prisma/client';
import { Clock } from 'src/modules/framework/clock';
import { API_CONFIG_TOKEN, type ApiConfig } from 'src/modules/framework/config';
import { Db } from 'src/modules/framework/database';
import * as time from 'src/utils/time';

import { Files } from './files';

@Command({ description: 'deletes the files nothing refers to anymore', name: 'delete-unused-files' })
export class DeleteUnusedFilesCommand extends CommandRunner {
  private readonly logger = new Logger(DeleteUnusedFilesCommand.name);

  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
    private readonly files: Files,
    @Inject(API_CONFIG_TOKEN) private readonly config: ApiConfig,
  ) {
    super();
  }

  @Option({
    description: 'deletes the listed files, which are only listed otherwise',
    flags: '--delete',
    name: 'delete',
  })
  parseDelete(): boolean {
    return true;
  }

  async run(_inputs: string[], options: { delete?: boolean }): Promise<void> {
    const unused = await this.db.withTransaction(Propagation.RequiresNew, () =>
      this.db.tx.file.findMany({
        select: { createdAt: true, id: true, path: true } satisfies Prisma.FileSelect,
        where: {
          agendaPdf: { none: {} },
          attachedToNominationFiles: { none: {} },
          attachedToObservationMemberComments: { none: {} },
          attachedToObservations: { none: {} },
          attachedToReports: { none: {} },
          attachedToSessions: { none: {} },
          attachedToSummaries: { none: {} },
          bucket: this.config.s3.bucket,
          // an upload stays unattached for a moment before its attachment is written
          createdAt: { lt: new Date(this.clock.now().getTime() - time.DAYS) },
          includedInSummariesContent: { none: {} },
          ingestionJobFile: { none: {} },
          justicePresentationPdf: { none: {} },
          // the LODAM imports are kept on purpose until the business says otherwise
          NOT: { path: { has: 'lodam' } },
          officialReportPdf: { none: {} },
        },
      }),
    );

    for (const file of unused) {
      this.logger.log(`${file.id} ${file.createdAt.toISOString()} ${file.path.join('/')}`);
    }

    if (options.delete) await this.files.deleteNow(unused);

    this.logger.log(`${options.delete ? 'Deleted' : 'Would delete'} ${unused.length} files`);
  }
}

@Module({ providers: [DeleteUnusedFilesCommand] })
export class DeleteUnusedFilesCliModule {}
