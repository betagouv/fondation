import { Propagation } from '@nestjs-cls/transactional';
import { Inject, Logger, Module } from '@nestjs/common';
import { Command, CommandRunner, Option } from 'nest-commander';

import { Prisma } from 'src/generated/prisma/client';
import { Clock } from 'src/modules/framework/clock';
import { API_CONFIG_TOKEN, type ApiConfig } from 'src/modules/framework/config';
import { Db } from 'src/modules/framework/database';
import * as time from 'src/utils/time';

import { Files } from './files';

@Command({
  description: 'deletes the objects of the storage no file refers to',
  name: 'delete-unreferenced-objects',
})
export class DeleteUnreferencedObjectsCommand extends CommandRunner {
  private readonly logger = new Logger(DeleteUnreferencedObjectsCommand.name);

  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
    private readonly files: Files,
    @Inject(API_CONFIG_TOKEN) private readonly config: ApiConfig,
  ) {
    super();
  }

  @Option({
    description: 'deletes the listed objects, which are only listed otherwise',
    flags: '--delete',
    name: 'delete',
  })
  parseDelete(): boolean {
    return true;
  }

  async run(_inputs: string[], options: { delete?: boolean }): Promise<void> {
    const files = await this.db.withTransaction(Propagation.RequiresNew, () =>
      this.db.tx.file.findMany({
        select: { path: true } satisfies Prisma.FileSelect,
        where: { bucket: this.config.s3.bucket },
      }),
    );
    if (files.length === 0) throw new Error('No file in the database: every object would look unreferenced');

    // an object written before the paths were normalized keeps raw spaces: it may be the only copy of a missing file
    const referenced = new Set(files.flatMap(({ path }) => [path.join('/'), encodeURI(path.join('/'))]));
    // an upload is stored a moment before its file is written
    const writtenBefore = new Date(this.clock.now().getTime() - time.DAYS);

    const unreferenced: string[] = [];
    let size = 0;
    for await (const object of this.files.storedObjects()) {
      if (object.writtenAt >= writtenBefore || referenced.has(object.key)) continue;

      unreferenced.push(object.key);
      size += object.size;
      // Nest writes its own logs to stdout too: the tab tells the lines of the list apart
      process.stdout.write(`${object.writtenAt.toISOString()}\t${object.key}\n`);
    }

    if (options.delete) await this.files.deleteStoredObjects(unreferenced);

    this.logger.log(
      `${options.delete ? 'Deleted' : 'Would delete'} ${unreferenced.length} objects, ${(size / 1_000_000).toFixed(1)} MB`,
    );
  }
}

@Module({ providers: [DeleteUnreferencedObjectsCommand] })
export class DeleteUnreferencedObjectsCliModule {}
