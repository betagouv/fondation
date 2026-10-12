import { Injectable, InternalServerErrorException, Logger, StreamableFile } from '@nestjs/common';

import { makeStorablePath, Storable, Storage, Stored } from './storable.types';

type PutObject = Omit<Storable, 'path'> & { path: string | readonly string[] };

@Injectable()
export class Objects {
  private readonly logger = new Logger(Objects.name);

  constructor(private readonly storage: Storage) {}

  async put(objects: readonly PutObject[]): Promise<Stored[]> {
    const result = await this.storage.put(
      objects.map(({ path, ...o }) => ({ ...o, path: makeStorablePath(path) })),
    );

    if (!result.success) {
      throw new InternalServerErrorException();
    }

    return [...result.successes];
  }

  async delete(files: readonly { id: string }[]): Promise<void> {
    const result = await this.storage.delete(files);
    if (!result.success) {
      this.logger.warn(`failures when deleting files`);
      throw new InternalServerErrorException();
    }
  }

  async publish<T extends { id: string }>(
    objects: readonly T[],
  ): Promise<(T & { url: URL; expiresAt: Date })[]> {
    return this.storage.publish(objects);
  }

  async toStreamableFile(
    object: { id: string } | { publicUrlId: string },
  ): Promise<{ file: StreamableFile; expiresAt: Date | null }> {
    const { file, expiresAt = null } = await this.storage.toStreamableFile(object);
    return { file, expiresAt };
  }
}
