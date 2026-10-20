import { createHash } from 'node:crypto';
import { PassThrough, Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { inspect } from 'node:util';

import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  ListObjectVersionsCommand,
  PutBucketCorsCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { HttpService } from '@nestjs/axios';
import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  StreamableFile,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { lastValueFrom } from 'rxjs';

import { Prisma } from '../../../generated/prisma/client';
import { makeId } from '../../../utils/id';
import { assertIsDefined } from '../../../utils/is-defined';
import { noop } from '../../../utils/noop';
import { ignoreAsync, isFulfilled } from '../../../utils/promises';
import * as time from '../../../utils/time';
import { Clock } from '../clock';
import { API_CONFIG_TOKEN, type ApiConfig } from '../config';
import { afterCommit, Db } from '../database';

import { contentDisposition } from './content-disposition';
import { type FondationFile, type StoredSize } from './files.types';
import { filenameToMimeType } from './mime-type';
import { FileMissingFromStorage, isMissingFromStorage } from './missing-from-storage';

/** @internal */
class RollbackFilePathOperationError {
  constructor(
    readonly filesToDelete: readonly ({ id: string; path: readonly string[] } | string)[],
    readonly cause: Error,
  ) {}
}

/** @internal */
class RollbackDeleteFilesCommandError {
  constructor(
    readonly pathsToDelete: readonly {
      Key: string | undefined;
      VersionId: string | undefined;
    }[],

    readonly cause: Error,
  ) {}
}

/**
 * This is intended to be an abstraction over any S3 compatible client.
 * It synchronizes our database table "files_context"."files".
 *
 * Design elements:
 *  - lean API, we limit the number of operations possible, always on a list of files
 *  - dual writes operations, if any fails we try to rollback the operations (in best effort)
 */
@Injectable()
export class Files implements OnApplicationBootstrap {
  private readonly logger = new Logger(Files.name);

  private readonly client: S3Client;
  private readonly bucketName: string;
  private readonly expiresInSeconds: number;
  private readonly hasSse: boolean = false;
  private readonly sseHeaders:
    | {
        SSECustomerAlgorithm: 'AES256';
        SSECustomerKey: string;
        SSECustomerKeyMD5: string;
      }
    | Record<string, never> = {};

  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
    private readonly http: HttpService,
    @Inject(API_CONFIG_TOKEN)
    private readonly config: ApiConfig,
  ) {
    const { encryptionKeyBase64: SSECustomerKey } = config.s3;
    if (SSECustomerKey) {
      const SSECustomerKeyMD5 = createHash('md5')
        .update(Buffer.from(SSECustomerKey, 'base64'))
        .digest('base64');

      this.hasSse = true;
      this.sseHeaders = {
        SSECustomerAlgorithm: 'AES256',
        SSECustomerKey,
        SSECustomerKeyMD5,
      };
    }

    this.expiresInSeconds = config.s3.signedUrlDurationSeconds;
    this.bucketName = config.s3.bucket;
    this.client = new S3Client({
      credentials: config.s3.credentials,
      endpoint: config.s3.endpoint,
      forcePathStyle: config.s3.forcePathStyle,
      maxAttempts: 3,
      region: config.s3.region,
    });
  }

  @Transactional(Propagation.RequiresNew)
  async getPublicUrls(fileIds: readonly string[]): Promise<{ [fileId: string]: URL }> {
    if (fileIds.length === 0) return {};

    const files = await this.db.tx.file.findMany({
      select: {
        filePublicUrls: {
          orderBy: [{ expiresAt: 'desc' }],
          select: { expiresAt: true, id: true, url: true },
          take: 1,
          where: { expiresAt: { gt: this.clock.now() } },
        },
        id: true,
        name: true,
        path: true,
      } satisfies Prisma.FileSelect,
      where: { id: { in: fileIds as string[] } },
    });

    const publicUrls = await Promise.allSettled(
      files.map((file) => {
        const publicUrl = file.filePublicUrls[0];
        if (publicUrl) {
          return Promise.resolve({
            ...publicUrl,
            existing: true,
            fileId: file.id,
            publicUrl: new URL(`${this.config.originUrl}/api/files/v1/${publicUrl.id}`),
          });
        }

        return this.generatePublicUrl(file);
      }),
    ).then((result) => {
      for (const outcome of result) {
        if (outcome.status === 'rejected') {
          this.logger.error(`failed to build a public url`, outcome.reason);
        }
      }

      return result.filter(isFulfilled).map(({ value }) => value);
    });

    await this.db.tx.filePublicUrl.createMany({
      data: publicUrls
        .filter((x) => !('existing' in x))
        .map((x) => ({
          expiresAt: x.expiresAt,
          fileId: x.fileId,
          id: x.id,
          url: x.url.toString(),
        })),
    });

    return Object.fromEntries(publicUrls.map((x) => [x.fileId, x.publicUrl]));
  }

  async openBatchStreamSession(
    factory: (helper: { streamTo(file: Omit<FondationFile, 'buffer'>): Writable }) => Promise<unknown>,
  ): Promise<string[]> {
    const fileStoragePromises: {
      file: Omit<FondationFile, 'buffer'>;
      promise: Promise<unknown>;
    }[] = [];
    const helper = {
      streamTo: (file: Omit<FondationFile, 'buffer'>) => {
        const path = file.path
          .split('/')
          .filter((x) => !!x.trim())
          .join('/');

        const passthrough = new PassThrough();
        const upload = new Upload({
          client: this.client,
          params: {
            ...this.sseHeaders,
            Body: passthrough,
            Bucket: this.bucketName,
            ContentType: file.mimeType,
            Key: encodeURI(path),
            Metadata: Object.fromEntries(
              Object.entries(file.meta ?? {}).filter((entry): entry is [string, string] => !!entry[1]),
            ),
          },
        });

        fileStoragePromises.push({
          file: { ...file, path },
          promise: Sentry.startSpan(
            {
              attributes: {
                'file.name': file.name,
                'file.type': file.mimeType,
              },
              name: 'fr.csm.fondation:files:create_single',
            },
            async (span) => {
              const { $metadata } = await upload.done();
              if (($metadata.attempts ?? 0) > 1) {
                span.setAttribute('attempts', $metadata.attempts);
              }
            },
          ),
        });

        return passthrough;
      },
    };

    await Sentry.startSpan({ name: 'fr.csm.fondation:files:create' }, (span) =>
      factory(helper).catch((error) => {
        span.setAttribute('error', error);
        Sentry.captureException(error);
        this.logger.warn(`file batch stream session factory failed with error: ${error}`);
      }),
    );

    if (fileStoragePromises.length === 0) return [];

    const fulfilled: Omit<FondationFile, 'buffer'>[] = [];
    const rejected: Omit<FondationFile, 'buffer'>[] = [];

    await Promise.allSettled(
      fileStoragePromises.map(({ file, promise }) =>
        promise.then(
          () => fulfilled.push(file),
          (error) => {
            Sentry.getActiveSpan()?.recordException(error);
            Sentry.getActiveSpan()?.setAttribute('error', error);

            this.logger.warn(`HTTP error while uploading file to S3`, {
              error,
            });

            rejected.push(file);
          },
        ),
      ),
    );

    if (rejected.length > 0) {
      await this._delete(fulfilled.map((file) => file.path));
      throw new InternalServerErrorException(`Failed uploading ${rejected.length} files`);
    }

    try {
      return await this.db.withTransaction(Propagation.RequiresNew, async () => {
        const toCreate = fulfilled.map((file) => ({
          bucket: this.bucketName,
          id: file.meta?.id ?? makeId('FileId'),
          name: file.name,
          path: file.path.split('/'),
          sizeInBytes: file.size ?? null,
        }));

        await this.db.tx.file.createMany({ data: toCreate });
        return toCreate.map(({ id }) => id);
      });
    } catch (error) {
      this.logger.warn(`SQL error, while creating files`, { error });
      ignoreAsync(() => this._delete(fulfilled.map((file) => file.path)));
      throw new InternalServerErrorException(`Failed uploading ${fulfilled.length} files`);
    }
  }

  async create(files: readonly FondationFile[]): Promise<string[]> {
    return this.openBatchStreamSession(async (h) => {
      for (const { buffer, ...file } of files) {
        await pipeline(Readable.from(buffer), h.streamTo(file));
      }
    });
  }

  /**
   * this is a best effort request to delete the files, made once the current transaction is committed:
   * a file left over is litter, a file gone while its row still points to it is a breakdown
   */
  delete(files: readonly { id: string; path: readonly string[] }[]): void {
    afterCommit(this.db, () =>
      ignoreAsync(() =>
        Sentry.startSpan(
          {
            attributes: { objectsCount: files.length },
            name: 'fr.csm.fondation:files:delete',
          },
          () => this._delete(files),
        ),
      ),
    );
  }

  /** outside of a transaction, for a caller that has to know the deletion went through */
  deleteNow(files: readonly { id: string; path: readonly string[] }[]): Promise<void> {
    return this._delete(files);
  }

  /** a linked observation file is another row pointing to the same object: the object stays while one of them remains */
  private async pathsStillReferenced(
    files: readonly ({ id: string; path: readonly string[] } | string)[],
  ): Promise<Set<string>> {
    const rows = files.filter((file) => typeof file !== 'string');
    if (rows.length === 0) return new Set();

    const others = await this.db.withTransaction(Propagation.RequiresNew, () =>
      this.db.tx.file.findMany({
        select: { path: true } satisfies Prisma.FileSelect,
        where: {
          bucket: this.bucketName,
          id: { notIn: rows.map(({ id }) => id) },
          OR: rows.map((file) => ({ path: { equals: [...file.path] } })),
        },
      }),
    );

    return new Set(others.map(({ path }) => path.join('/')));
  }

  private async _delete(files: readonly ({ id: string; path: readonly string[] } | string)[]): Promise<void> {
    if (files.length === 0) return;
    try {
      const sharedPaths = await this.pathsStillReferenced(files);
      const objects = files.filter(
        (file) => typeof file === 'string' || !sharedPaths.has(file.path.join('/')),
      );

      const response =
        objects.length > 0
          ? await this.client.send(
              new DeleteObjectsCommand({
                Bucket: this.bucketName,
                Delete: {
                  Objects: objects.map((file) => ({
                    Key: typeof file === 'string' ? encodeURI(file) : encodeURI(file.path.join('/')),
                  })),
                },
              }),
            )
          : null;

      if (response && (response.Errors?.length ?? 0) > 0) {
        const deletedPaths = (response.Deleted ?? [])
          .filter((d) => d.DeleteMarker)
          .map((d) => ({ Key: d.Key, VersionId: d.DeleteMarkerVersionId }));

        this.logger.warn(`Failed deleting ${response.Errors?.length ?? 0} files ${inspect(response.Errors)}`);

        throw new RollbackDeleteFilesCommandError(
          deletedPaths,
          new InternalServerErrorException(`failed deleting ${response.Errors?.length ?? 0} files`),
        );
      }

      await this.db
        .withTransaction(Propagation.RequiresNew, async () => {
          for (const file of files) {
            if (typeof file === 'string') {
              const path = file.split('/');
              await this.db.tx.file.deleteMany({
                where: { bucket: this.bucketName, path: { equals: path } },
              });
            } else {
              await this.db.tx.file.delete({ where: { id: file.id } });
            }
          }
        })
        .catch((err) => {
          throw new RollbackFilePathOperationError(
            files,
            new InternalServerErrorException(`failed deleting ${files.length} files`, err),
          );
        });
    } catch (err) {
      if (
        !(err instanceof RollbackDeleteFilesCommandError) &&
        !(err instanceof RollbackFilePathOperationError)
      ) {
        this.logger.error(`Unknown error ${inspect(err)}`);
        throw err;
      }

      ignoreAsync(async () => {
        const versionsToDelete: {
          Key: string | undefined;
          VersionId: string | undefined;
        }[] = [];

        if (err instanceof RollbackDeleteFilesCommandError) {
          versionsToDelete.push(...err.pathsToDelete);
        } else {
          for (const file of err.filesToDelete) {
            try {
              const objectVersion = await this.client.send(
                new ListObjectVersionsCommand({
                  Bucket: this.bucketName,
                  Prefix: typeof file === 'string' ? encodeURI(file) : encodeURI(file.path.join('/')),
                }),
              );
              const lastDeleted = objectVersion.DeleteMarkers?.find((v) => v.IsLatest);

              if (!lastDeleted) continue;

              versionsToDelete.push({
                Key: lastDeleted.Key,
                VersionId: lastDeleted.VersionId,
              });
            } catch {
              continue;
            }
          }
        }

        await this.client
          .send(
            new DeleteObjectsCommand({
              Bucket: this.bucketName,
              Delete: {
                Objects: versionsToDelete.filter((path) => !!path.Key),
                Quiet: true,
              },
            }),
          )
          .catch(noop);
      });

      throw err.cause;
    }
  }

  async getFileContent(
    fileUrlId: string,
    options?: { download?: boolean },
  ): Promise<{ expiresAt: Date; file: StreamableFile }> {
    const file = await this.db.withTransaction(Propagation.RequiresNew, () =>
      this.db.tx.filePublicUrl.findUnique({
        select: {
          expiresAt: true,
          file: { select: { id: true, name: true, path: true } },
          url: true,
        } satisfies Prisma.FilePublicUrlSelect,
        where: { expiresAt: { gt: this.clock.now() }, id: fileUrlId },
      }),
    );

    if (!file) throw new NotFoundException();

    let headers: Record<string, string> = {};
    if (this.hasSse) {
      const { SSECustomerAlgorithm, SSECustomerKey, SSECustomerKeyMD5 } = this.sseHeaders;

      headers = {
        'x-amz-server-side-encryption-customer-algorithm': SSECustomerAlgorithm,
        'x-amz-server-side-encryption-customer-key': SSECustomerKey,
        'x-amz-server-side-encryption-customer-key-MD5': SSECustomerKeyMD5,
      };
    }

    const response = await lastValueFrom(
      this.http.get(file.url, {
        headers,
        responseType: 'stream',
      }),
    ).catch((error: unknown) => {
      if (isMissingFromStorage(error)) {
        this.reportMissingFromStorage(file.file);
        throw new FileMissingFromStorage();
      }

      throw error;
    });

    return {
      expiresAt: file.expiresAt,
      file: new StreamableFile(response.data, {
        disposition: contentDisposition({ download: options?.download, name: file.file.name }),
        type: filenameToMimeType(file.file.name),
      }),
    };
  }

  async getFile(props: { fileId: string }): Promise<Readable | null> {
    const storedFile = await this.db.withTransaction(Propagation.RequiresNew, () =>
      this.db.tx.file.findUnique({
        select: { path: true } satisfies Prisma.FileSelect,
        where: { id: props.fileId },
      }),
    );

    if (!storedFile) return null;

    const command = new GetObjectCommand({
      ...this.sseHeaders,
      Bucket: this.bucketName,
      Key: encodeURI(storedFile.path.join('/')),
    });

    const response = await this.client.send(command).catch((error: unknown) => {
      if (!isMissingFromStorage(error)) throw error;

      this.reportMissingFromStorage({ id: props.fileId, path: storedFile.path });
      return null;
    });

    if (!response) return null;
    return assertIsDefined(response.Body as Readable | undefined, `file ${props.fileId} not found`);
  }

  async storedSize(file: { path: readonly string[] }): Promise<StoredSize> {
    const key = encodeURI(file.path.join('/'));

    try {
      const { ContentLength } = await this.client.send(
        new HeadObjectCommand({ ...this.sseHeaders, Bucket: this.bucketName, Key: key }),
      );

      return { size: assertIsDefined(ContentLength, `no size for ${key}`), status: 'FOUND' };
    } catch (error) {
      if (!(error instanceof S3ServiceException)) throw error;

      // a HEAD answer has no body to name the error: its status is the only clue
      if (error.$metadata.httpStatusCode === 404) return { status: 'MISSING' };
      if (error.$metadata.httpStatusCode === 403) return { status: 'REFUSED' };
      throw error;
    }
  }

  async *storedObjects(): AsyncGenerator<{ key: string; size: number; writtenAt: Date }> {
    let ContinuationToken: string | undefined;
    do {
      const page = await this.client.send(
        new ListObjectsV2Command({ Bucket: this.bucketName, ContinuationToken }),
      );
      for (const object of page.Contents ?? []) {
        yield {
          key: assertIsDefined(object.Key, 'object without key'),
          size: object.Size ?? 0,
          writtenAt: assertIsDefined(object.LastModified, `no date for ${object.Key}`),
        };
      }
      ContinuationToken = page.NextContinuationToken;
    } while (ContinuationToken);
  }

  /** by their exact keys: objects written before the paths were normalized keep raw spaces, which encoding again would miss */
  async deleteStoredObjects(keys: readonly string[]): Promise<void> {
    // S3 deletes at most 1 000 objects per request
    for (let start = 0; start < keys.length; start += 1_000) {
      const { Errors = [] } = await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucketName,
          Delete: { Objects: keys.slice(start, start + 1_000).map((Key) => ({ Key })), Quiet: true },
        }),
      );
      if (Errors.length > 0) throw new Error(`Failed deleting ${Errors.length} objects ${inspect(Errors)}`);
    }
  }

  private reportMissingFromStorage(file: { id: string; path: readonly string[] }): void {
    Sentry.captureMessage('A file known to the database is missing from the storage', {
      extra: { fileId: file.id, path: file.path.join('/') },
      level: 'warning',
    });
  }

  private async generatePublicUrl(file: { id: string; path: readonly string[] }): Promise<{
    expiresAt: Date;
    fileId: string;
    id: string;
    publicUrl: URL;
    url: URL;
  }> {
    const id = makeId('FilePublicUrlId');
    const publicUrl = new URL(`${this.config.originUrl}/api/files/v1/${id}`);
    const expiresAt = new Date(this.clock.now().getTime() + this.expiresInSeconds * time.SECONDS);
    const url = new URL(
      await getSignedUrl(
        this.client,
        new GetObjectCommand({
          ...this.sseHeaders,
          Bucket: this.bucketName,
          Key: encodeURI(file.path.join('/')),
        }),
        { expiresIn: this.expiresInSeconds },
      ),
    );

    return { expiresAt, fileId: file.id, id, publicUrl, url };
  }

  async onApplicationBootstrap(): Promise<void> {
    if (this.config.isProduction) {
      await this.ensureBucketExists();
      await this.putBucketCors();
    }
  }

  private async ensureBucketExists(): Promise<void> {
    await this.client.send(new HeadBucketCommand({ Bucket: this.bucketName }));
  }

  private async putBucketCors() {
    await this.client.send(
      new PutBucketCorsCommand({
        Bucket: this.bucketName,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ['*'],
              AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
              AllowedOrigins: [this.config.originUrl],
              ExposeHeaders: ['ETag'],
              MaxAgeSeconds: (12 * time.HOURS) / time.SECONDS,
            },
            {
              AllowedHeaders: ['*'],
              AllowedMethods: ['GET', 'HEAD'],
              AllowedOrigins: [this.config.frontendOriginUrl],
              ExposeHeaders: ['ETag'],
              MaxAgeSeconds: (12 * time.HOURS) / time.SECONDS,
            },
          ],
        },
      }),
    );
  }
}
