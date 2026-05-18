import { StreamableFile } from '@nestjs/common';

import { StorageResult } from './result.storable';

export type Storable = { name: string; mime: string; content: Buffer | ReadableStream };
export type StorablePath = readonly [string, ...string[]];
export type StorablePathFactory = (stored: Stored) => StorablePath;
export type Stored = Omit<Storable, 'content'> & {
  id: string;
  ext: string;
  bucket: string;
  path: StorablePath;
};

/** @internal */
export interface Storage {
  put(objects: readonly (Stored & { content: ReadableStream | Buffer })[]): Promise<StorageResult<Stored>>;
  delete(objects: readonly { id: string; path?: StorablePath }[]): Promise<StorageResult<{ id: string }>>;

  publish<T extends { id: string; path?: StorablePath }>(
    objects: readonly T[],
  ): Promise<(T & { url: URL; expiresAt: Date })[]>;
  toStreamableFile(
    object:
      | { publicUrlId: string }
      | { id: string; path?: StorablePath; name?: string; expiresAt?: Date }
      | { url: URL; expiresAt?: Date },
  ): Promise<{ file: StreamableFile; expiresAt?: Date }>;
}
