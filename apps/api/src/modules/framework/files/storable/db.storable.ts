import { Propagation } from '@nestjs-cls/transactional';
import { Inject, Injectable, Logger, NotFoundException, StreamableFile } from '@nestjs/common';

import { Prisma } from 'src/generated/prisma/client';
import { Clock } from 'src/modules/framework/clock';
import { API_CONFIG_TOKEN, ApiConfig } from 'src/modules/framework/config';
import { Db } from 'src/modules/framework/database';
import { makeId } from 'src/utils/id';
import { partition } from 'src/utils/iterables';
import { noop } from 'src/utils/noop';

import { StorageResult } from './result.storable';
import { Storable, StorablePath, type Storage, type Stored } from './storable.types';

@Injectable()
export class DbStorage implements Storage {
  private readonly logger = new Logger(DbStorage.name);

  private readonly originUrl: string;

  constructor(
    private readonly clock: Clock,
    private readonly storage: Storage,
    private readonly db: Db,

    @Inject(API_CONFIG_TOKEN)
    config: ApiConfig,
  ) {
    this.originUrl = config.originUrl;
  }

  async put(objects: readonly Storable[]): Promise<StorageResult<Stored>> {
    const result = await this.storage.put(objects);
    if (!result.success) {
      await result.rollback().catch(noop);
      return result;
    }

    try {
      await this.db.withTransaction(Propagation.RequiresNew, () =>
        this.db.tx.file.createMany({
          data: result.successes.map((f) => ({
            bucket: f.bucket,
            createdById: f.createdById,
            id: f.id,
            name: f.name,
            path: f.path as unknown as string[],
            sizeInBytes: f.byteSize,
          })),
        }),
      );

      return new StorageResult<Stored>(this.logger, () =>
        this.db.withTransaction(Propagation.RequiresNew, () =>
          this.db.tx.file.deleteMany({ where: { id: { in: objects.map(({ id }) => id) } } }).catch((err) => {
            this.logger.error(`Could not delete ${objects.length} files`, err);
          }),
        ),
      ).succeed(...result.successes);
    } catch (error) {
      await result.rollback().catch(noop);

      this.logger.error(`failed to create ${objects.length} files`, error);
      return new StorageResult<Stored>(this.logger).fail(...result.successes);
    }
  }

  async delete(
    files: readonly { id: string; path?: StorablePath }[],
  ): Promise<StorageResult<{ id: string }>> {
    const r = new StorageResult<{ id: string }>(this.logger);
    if (files.length === 0) return r;

    try {
      await this.db.withTransaction(async () => {
        for (const file of files) {
          const { path } = await this.db.tx.file.delete({
            select: { path: true } satisfies Prisma.FileSelect,
            where: { id: file.id },
          });
          file.path = path as unknown as StorablePath;
        }
      });

      r.succeed(...files);

      await this.storage.delete(files).catch(noop);
    } catch (error) {
      this.logger.error(`failed deleting ${files.length} files`, error);
      r.fail(...files);
    }

    return r;
  }

  async publish<T extends { id: string; path?: StorablePath }>(
    objects: readonly T[],
  ): Promise<(T & { expiresAt: Date; url: URL })[]> {
    const objectsById = new Map(objects.map((object) => [object.id, object] as const));
    return this.db.withTransaction(Propagation.RequiresNew, async () => {
      const files = await this.db.tx.file.findMany({
        select: {
          filePublicUrls: {
            orderBy: { expiresAt: 'desc' },
            select: { expiresAt: true, id: true },
            take: 1,
            where: { expiresAt: { gt: this.clock.now() } },
          },
          id: true,
          path: true,
        } satisfies Prisma.FileSelect,
        where: { id: { in: objects.map(({ id }) => id) } },
      });

      const [withExistingUrl, withoutExistingUrl] = partition(
        files,
        (file) => file.filePublicUrls.length > 0,
      );

      return [
        ...withExistingUrl.flatMap((x) => {
          const original = objectsById.get(x.id);
          if (!original || !x.filePublicUrls[0]) return [];

          const [{ expiresAt, id }] = x.filePublicUrls;
          return [{ ...original, expiresAt, url: this.makeObjectPublicUrl(id) }];
        }),
        ...(await this.storage
          .publish(withoutExistingUrl as unknown as readonly { id: string; path: StorablePath }[])
          .then(async (withUrls) => {
            const toReturn: (T & { expiresAt: Date; url: URL })[] = [];
            const toCreate: { expiresAt: Date; fileId: string; id: string; url: string }[] = [];

            for (const x of withUrls) {
              const original = objectsById.get(x.id);
              if (!original) continue;

              const id = makeId('FilePublicUrlId');
              const url = this.makeObjectPublicUrl(id);

              toReturn.push({ ...original, expiresAt: x.expiresAt, url });
              toCreate.push({
                expiresAt: x.expiresAt,
                fileId: original.id,
                id,
                url: x.url.toString(),
              });
            }

            await this.db.tx.filePublicUrl.createMany({
              data: toCreate,
            });

            return toReturn;
          })),
      ];
    });
  }

  private makeObjectPublicUrl(publicUrlId: string): URL {
    return new URL(`${this.originUrl}/api/files/v1/${publicUrlId}`);
  }

  async toStreamableFile(
    object:
      | { expiresAt?: Date; id: string; name?: string; path?: StorablePath }
      | { expiresAt?: Date; name?: string; path?: StorablePath; publicUrlId: string }
      | { expiresAt?: Date; url: URL },
  ): Promise<{ expiresAt?: Date; file: StreamableFile }> {
    if ('url' in object) {
      return this.storage.toStreamableFile(object);
    }

    if ('id' in object) {
      const file = await this.db.tx.file.findUnique({
        select: { id: true, name: true, path: true } satisfies Prisma.FileSelect,
        where: { id: object.id },
      });

      return this.storage.toStreamableFile(
        file as unknown as { id: string; name: string; path: StorablePath },
      );
    }

    const publicUrl = await this.db.tx.filePublicUrl.findUnique({
      select: { expiresAt: true, url: true } satisfies Prisma.FilePublicUrlSelect,
      where: { expiresAt: { gt: this.clock.now() }, id: object.publicUrlId },
    });

    if (!publicUrl) {
      throw new NotFoundException();
    }

    return this.toStreamableFile({ expiresAt: publicUrl.expiresAt, url: new URL(publicUrl.url) });
  }
}
