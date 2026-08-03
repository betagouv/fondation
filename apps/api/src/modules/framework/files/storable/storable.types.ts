// oxlint-disable typescript/no-unsafe-declaration-merging

import type { StreamableFile } from '@nestjs/common';
import type { Readable } from 'node:stream';

import type { StorageResult } from './result.storable';

type StorableContent = Buffer | ReadableStream | Readable | Blob;

export class InvalidStorablePath extends Error {}
function isStorablePath(value: readonly string[]): value is StorablePath {
  return value.length > 0;
}

export type StorablePath = readonly [string, ...string[]];
export function makeStorablePath(value: string | readonly string[]): StorablePath {
  if (typeof value === 'string') {
    return makeStorablePath(value.replace(/^\//g, '').replace(/\/$/g, '').split('/'));
  }

  const maybePath = value.flatMap((x) => {
    const t = x?.trim();
    return t ? [t] : [];
  });

  if (!isStorablePath(maybePath)) throw new InvalidStorablePath();
  return maybePath;
}

export type Storable = {
  id: string;
  name: string;
  mime: string;
  path: StorablePath;
  content: StorableContent;
};

export type Stored = Omit<Storable, 'content'> & {
  bucket: string;
  byteSize: number;
};

/** @internal */
export interface Storage {
  put(objects: readonly Storable[]): Promise<StorageResult<Stored>>;

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

export class Storage {}
