import { PassThrough, Readable } from 'node:stream';

import {
  CompleteMultipartUploadCommandOutput,
  DeleteObjectsCommand,
  DeleteObjectsCommandOutput,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';

import { Clock } from '../../clock';
import { API_CONFIG_TOKEN, ApiConfig } from '../../config';
import * as time from 'src/utils/time';

import { StorageResult } from './result.storable';
import { S3Client } from './s3';
import type { Storable, StorablePath, Storage, Stored } from './storable.types';

@Injectable()
export class S3Storage implements Storage {
  private readonly logger = new Logger(S3Storage.name);
  private readonly expiresInSeconds: number;

  constructor(
    private readonly s3: S3Client,
    private readonly clock: Clock,
    @Inject(API_CONFIG_TOKEN)
    config: ApiConfig,
  ) {
    this.expiresInSeconds = config.s3.signedUrlDurationSeconds;
  }

  async put(objects: readonly Storable[]): Promise<StorageResult<Stored>> {
    const r = new StorageResult<Stored>(this.logger, ({ successes }) => this.innerDelete(successes));

    for (const storable of objects) {
      await this.innerUpload(storable).then(
        ({ Bucket, contentByteSize }) =>
          r.succeed({ ...storable, bucket: Bucket!, byteSize: contentByteSize }),

        (error) => {
          this.logger.error(`Failed uploading ${storable.id}`, error);
          // bucket is never used in case of deletion
          r.fail({ ...storable, bucket: '', byteSize: 0 });
        },
      );
    }

    return r;
  }

  async delete(
    objects: readonly { id: string; path?: StorablePath }[],
  ): Promise<StorageResult<{ id: string }>> {
    if (objects.some((object) => !object.path)) {
      this.logger.warn(`some objects have no path`);
      return new StorageResult<{ id: string }>(this.logger).fail(...objects);
    }

    const objectsWithPath = objects as readonly { id: string; path: StorablePath }[];

    const [err, result] = await this.innerDelete(objectsWithPath);
    if (err || !result) {
      return new StorageResult<{ id: string }>(this.logger).fail(...objects);
    }

    const deletedByKey = new Map(
      (result.Deleted ?? []).flatMap(({ DeleteMarker, DeleteMarkerVersionId, Key }) =>
        DeleteMarker && DeleteMarkerVersionId ? [[Key, DeleteMarkerVersionId]] : [],
      ),
    );

    const deleted = this.s3.buildCommand(({ key }) =>
      objectsWithPath.flatMap((object) => {
        const k = key(object);
        const versionId = deletedByKey.get(k);

        return versionId ? [{ id: object.id, path: object.path, versionId }] : [];
      }),
    );

    const finalResult = new StorageResult<{ id: string; path: StorablePath; versionId: string }>(
      this.logger,
      ({ successes }) => this.innerDelete(successes),
    ).succeed(...deleted);

    return finalResult as unknown as StorageResult<{ id: string }>;
  }

  async publish<T extends { id: string; path?: StorablePath }>(
    objects: readonly T[],
  ): Promise<(T & { url: URL; expiresAt: Date })[]> {
    if (objects.some((object) => !object.path)) {
      this.logger.error(`Received object without path`);
      throw new InternalServerErrorException();
    }

    return Promise.all(
      objects.map(async (object) => {
        const url = await getSignedUrl(this.s3.client, this.innerGet({ path: object.path as StorablePath }), {
          expiresIn: this.expiresInSeconds,
        });

        const expiresAt = new Date(this.clock.now().getTime() + this.expiresInSeconds * time.SECONDS);
        return { ...object, expiresAt, url: new URL(url) };
      }),
    );
  }

  private innerDelete(
    objects: readonly { path: StorablePath; versionId?: string }[],
  ): Promise<[unknown, DeleteObjectsCommandOutput | null]> {
    if (objects.length === 0) return Promise.resolve([null, null]);

    return this.s3
      .send(
        this.s3.buildCommand(
          ({ command, key }) =>
            new DeleteObjectsCommand({
              ...command,
              Delete: {
                Objects: objects.map((object) => ({ Key: key(object), VersionId: object.versionId })),
              },
            }),
        ),
      )
      .then(
        (r) => {
          if (r.Errors?.length) {
            this.logger.error(`${r.Errors?.length} s3 errors`, r.Errors);
            return [r.Errors, null] as const;
          }

          return [null, r] as const;
        },
        (error) => {
          this.logger.error(`Failed deleting ${objects.length} files`, error);
          return [error, null] as const;
        },
      );
  }

  private async innerUpload(
    storable: Storable,
  ): Promise<CompleteMultipartUploadCommandOutput & { contentByteSize: number }> {
    const { content, promise: sizePromise } = withSize(storable.content);
    const responsePromise = this.s3
      .buildCommand(
        ({ command, key }) =>
          new Upload({
            client: this.s3.client,
            params: {
              ...command,

              Body: content,
              Key: key(storable),
              ContentType: storable.mime,
              // S3 metadata travels in HTTP headers, which only carry ASCII
              Metadata: { id: storable.id, name: encodeURIComponent(storable.name) },
            },
          }),
      )
      .done();

    const [response, size] = await Promise.all([responsePromise, sizePromise]);

    return { ...response, contentByteSize: size };
  }

  private innerGet(object: { path: StorablePath }): GetObjectCommand {
    return this.s3.buildCommand(({ key, command }) => new GetObjectCommand({ ...command, Key: key(object) }));
  }
}

function withSize(content: Storable['content']): { content: Readable; promise: Promise<number> } {
  const passthrough = new PassThrough();
  const promise = new Promise<number>((resolve, reject) => {
    let alreadyResolved = false;
    let size = 0;

    passthrough.on('error', (error) => {
      if (alreadyResolved) return;

      alreadyResolved = true;
      reject(error);
    });

    passthrough.once('end', () => {
      if (alreadyResolved) return;

      alreadyResolved = true;
      resolve(size);
    });

    passthrough.on('data', (chunk) => {
      if (!Buffer.isBuffer(chunk)) return;

      size += chunk.byteLength;
    });
  });

  const content$: Readable = Buffer.isBuffer(content)
    ? Readable.from(content)
    : content instanceof Blob
      ? Readable.fromWeb(content.stream())
      : content instanceof ReadableStream
        ? Readable.fromWeb(content)
        : content;

  return { content: content$.pipe(passthrough), promise };
}
