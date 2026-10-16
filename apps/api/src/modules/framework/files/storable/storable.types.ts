// oxlint-disable typescript/no-unsafe-declaration-merging

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
  content: StorableContent;
  createdById?: string;
  id: string;
  mime: string;
  name: string;
  path: StorablePath;
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
  ): Promise<(T & { expiresAt: Date; url: URL })[]>;
}

export class Storage {}
