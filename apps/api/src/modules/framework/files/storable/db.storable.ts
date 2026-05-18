import { Inject, Injectable, Logger, NotFoundException, StreamableFile } from '@nestjs/common';

import { Clock } from 'src/modules/framework/clock';
import { API_CONFIG_TOKEN, ApiConfig } from 'src/modules/framework/config';
import { PrismaService } from 'src/modules/framework/database';
import { makeId } from 'src/utils/id';
import { partition } from 'src/utils/iterables';
import { noop } from 'src/utils/noop';

import { StorageResult } from './result.storable';
import { StorablePath, type Storage, type Stored } from './storable.types';

@Injectable()
export class PrismaStorage implements Storage {
  private readonly logger = new Logger(PrismaStorage.name);

  private readonly originUrl: string;

  constructor(
    private readonly clock: Clock,
    private readonly storage: Storage,
    private readonly prisma: PrismaService,

    @Inject(API_CONFIG_TOKEN)
    config: ApiConfig,
  ) {
    this.originUrl = config.originUrl;
  }

  async put(
    objects: readonly (Stored & { content: ReadableStream | Buffer })[],
  ): Promise<StorageResult<Stored>> {
    const result = await this.storage.put(objects);
    if (!result.success) {
      await result.rollback().catch(noop);
      return result;
    }

    try {
      await this.prisma.file.createMany({
        data: objects.map((f) => ({
          id: f.id,
          name: f.name,
          bucket: f.bucket,
          path: f.path as [string, ...string[]],
        })),
      });

      return new StorageResult<Stored>(this.logger, () =>
        this.prisma.file.deleteMany({ where: { id: { in: objects.map(({ id }) => id) } } }).catch((err) => {
          this.logger.error(`Could not delete ${objects.length} files`, err);
        }),
      ).succeed(...objects);
    } catch (error) {
      await result.rollback().catch(noop);

      this.logger.error(`failed to create ${objects.length} files`, error);
      return new StorageResult<Stored>(this.logger).fail(...objects);
    }
  }

  async delete(
    files: readonly { id: string; path?: StorablePath }[],
  ): Promise<StorageResult<{ id: string }>> {
    const r = new StorageResult<{ id: string }>(this.logger);

    try {
      await this.prisma.$transaction(async (tx) => {
        for (const file of files) {
          const { path } = await tx.file.delete({ where: { id: file.id }, select: { path: true } });
          file.path = path as unknown as StorablePath;
        }
      });

      r.succeed(...files);
    } catch (error) {
      this.logger.error(`failed deleting ${files.length} files`, error);
      r.fail(...files);
    }

    await this.storage.delete(files).catch(noop);

    return r;
  }

  async publish<T extends { id: string; path?: StorablePath }>(
    objects: readonly T[],
  ): Promise<(T & { url: URL; expiresAt: Date })[]> {
    const objectsById = new Map(objects.map((object) => [object.id, object] as const));
    return this.prisma.$transaction(async (tx) => {
      const files = await tx.file.findMany({
        where: { id: { in: objects.map(({ id }) => id) } },
        select: {
          id: true,
          path: true,
          filePublicUrls: {
            where: { expiresAt: { gt: this.clock.now() } },
            select: { id: true, expiresAt: true },
            orderBy: { expiresAt: 'desc' },
            take: 1,
          },
        },
      });

      const [withExistingUrl, withoutExistingUrl] = partition(
        files,
        (file) => file.filePublicUrls.length > 0,
      );

      return [
        ...withExistingUrl.flatMap((x) => {
          const original = objectsById.get(x.id);
          if (!original || !x.filePublicUrls[0]) return [];

          const [{ id, expiresAt }] = x.filePublicUrls;
          return [{ ...original, url: this.makeObjectPublicUrl(id), expiresAt }];
        }),
        ...(await this.storage
          .publish(withoutExistingUrl as unknown as readonly { id: string; path: StorablePath }[])
          .then(async (withUrls) => {
            const toReturn: (T & { url: URL; expiresAt: Date })[] = [];
            const toCreate: { fileId: string; url: string; id: string; expiresAt: Date }[] = [];

            for (const x of withUrls) {
              const original = objectsById.get(x.id);
              if (!original) continue;

              const id = makeId('FilePublicUrlId');
              const url = this.makeObjectPublicUrl(id);

              toReturn.push({ ...original, url, expiresAt: x.expiresAt });
              toCreate.push({
                id,
                url: url.toString(),
                fileId: original.id,
                expiresAt: x.expiresAt,
              });
            }

            await tx.filePublicUrl.createMany({
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
      | { id: string; path?: StorablePath; name?: string; expiresAt?: Date }
      | { publicUrlId: string; path?: StorablePath; name?: string; expiresAt?: Date }
      | { url: URL; expiresAt?: Date },
  ): Promise<{ file: StreamableFile; expiresAt?: Date }> {
    if ('url' in object) {
      return this.storage.toStreamableFile(object);
    }

    if ('id' in object) {
      const file = await this.prisma.file.findUnique({
        where: { id: object.id },
        select: { id: true, name: true, path: true },
      });

      return this.storage.toStreamableFile(
        file as unknown as { id: string; name: string; path: StorablePath },
      );
    }

    const publicUrl = await this.prisma.filePublicUrl.findUnique({
      where: { id: object.publicUrlId, expiresAt: { gt: this.clock.now() } },
      select: { url: true, expiresAt: true },
    });

    if (!publicUrl) {
      throw new NotFoundException();
    }

    return this.toStreamableFile({ url: new URL(publicUrl.url), expiresAt: publicUrl.expiresAt });
  }
}
