import { type Readable } from 'node:stream';

import {
  CompleteMultipartUploadCommandOutput,
  DeleteObjectsCommand,
  DeleteObjectsCommandOutput,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { HttpService } from '@nestjs/axios';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotImplementedException,
  StreamableFile,
} from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

import { Clock } from '../../clock';
import { API_CONFIG_TOKEN, ApiConfig } from '../../config';
import { filenameToMimeType } from '../mime-type';
import * as time from 'src/utils/time';

import { StorageResult } from './result.storable';
import { S3Client } from './s3';
import { type StorablePath, type Storage, type Stored } from './storable.types';
@Injectable()
export class S3Storage implements Storage {
  private readonly logger = new Logger(S3Storage.name);
  private readonly expiresInSeconds: number;

  constructor(
    private readonly http: HttpService,
    private readonly s3: S3Client,
    private readonly clock: Clock,
    @Inject(API_CONFIG_TOKEN)
    config: ApiConfig,
  ) {
    this.expiresInSeconds = config.s3.signedUrlDurationSeconds;
  }

  async put(
    objects: readonly (Stored & { content: ReadableStream | Buffer })[],
  ): Promise<StorageResult<Stored>> {
    const r = new StorageResult<Stored>(this.logger, ({ successes }) => this.innerDelete(successes));

    for (const stored of objects) {
      await this.innerUpload(stored).then(
        () => r.succeed(stored),
        () => r.fail(stored),
      );
    }

    return r;
  }

  async delete(
    objects: readonly { id: string; path?: StorablePath }[],
  ): Promise<StorageResult<{ id: string }>> {
    if (objects.some((object) => !object.path)) {
      this.logger.warn(`some objects have no path`);
      return new StorageResult<{ id: string }>().fail(...objects);
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

    return new StorageResult<{ id: string; path: StorablePath; versionId: string }>(
      this.logger,
      ({ successes }) => this.innerDelete(successes),
    ).succeed(...deleted);
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

  async toStreamableFile(
    object:
      | { url: URL; name?: string; expiresAt?: Date }
      | { id: string; path?: StorablePath; name?: string; expiresAt?: Date }
      | { publicUrlId: string; path?: StorablePath; name?: string; expiresAt?: Date },
  ): Promise<{ file: StreamableFile; expiresAt?: Date }> {
    if ('publicUrlId' in object) {
      this.logger.error(`S3 Storage called with public URL id`);
      throw new NotImplementedException();
    }

    let readable: Readable;
    if ('url' in object) {
      const request = this.s3.buildCommand(({ command }) => {
        const { SSECustomerKey, SSECustomerKeyMD5, SSECustomerAlgorithm } = command;
        return {
          headers: SSECustomerKey
            ? {
                'x-amz-server-side-encryption-customer-key': SSECustomerKey,
                'x-amz-server-side-encryption-customer-key-MD5': SSECustomerKeyMD5,
                'x-amz-server-side-encryption-customer-algorithm': SSECustomerAlgorithm,
              }
            : {},
        };
      });

      const response = await lastValueFrom(
        this.http.get(object.url.toString(), {
          ...request,
          responseType: 'stream',
        }),
      );

      readable = response.data;
    } else {
      if (!object.path) {
        this.logger.error(`Received object without path`);
        throw new InternalServerErrorException();
      }

      const response = await this.s3.send(this.innerGet(object as { path: StorablePath }));
      if (!response.Body) {
        this.logger.error(`Received no body from S3`);
        throw new InternalServerErrorException();
      }

      readable = response.Body as Readable;
    }

    return {
      expiresAt: object.expiresAt ?? this.fromNowUntilExpiration(),
      file: new StreamableFile(
        readable,
        object.name
          ? {
              type: filenameToMimeType(object.name),
              disposition: `inline; filename="${encodeURIComponent(object.name)}"`,
            }
          : undefined,
      ),
    };
  }

  private fromNowUntilExpiration(): Date {
    return new Date(this.clock.now().getTime() + this.expiresInSeconds * time.SECONDS);
  }

  private innerDelete(
    objects: readonly { path: StorablePath; versionId?: string }[],
  ): Promise<[unknown, DeleteObjectsCommandOutput | null]> {
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

  private innerUpload(
    stored: Stored & { content: Buffer | ReadableStream },
  ): Promise<CompleteMultipartUploadCommandOutput> {
    return this.s3
      .buildCommand(
        ({ command, key }) =>
          new Upload({
            client: this.s3.client,
            params: {
              ...command,

              Key: key(stored),
              Body: stored.content,
              ContentType: stored.mime,
              Metadata: { id: stored.id, name: stored.name },
            },
          }),
      )
      .done();
  }

  private innerGet(object: { path: StorablePath }): GetObjectCommand {
    return this.s3.buildCommand(({ key, command }) => new GetObjectCommand({ ...command, Key: key(object) }));
  }
}
