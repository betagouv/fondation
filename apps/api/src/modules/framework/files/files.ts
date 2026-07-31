import { createHash } from 'node:crypto';
import { PassThrough, Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { inspect } from 'node:util';

import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  ListObjectVersionsCommand,
  PutBucketCorsCommand,
  S3Client,
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

import { Clock } from '../clock';
import { API_CONFIG_TOKEN, type ApiConfig } from 'src/modules/framework/config';
import { Db } from 'src/modules/framework/database';
import { makeId } from 'src/utils/id';
import { assertIsDefined } from 'src/utils/is-defined';
import { noop } from 'src/utils/noop';
import { ignoreAsync, isFulfilled } from 'src/utils/promises';
import * as time from 'src/utils/time';

import { type FondationFile } from './files.types';
import { filenameToMimeType } from './mime-type';

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
        SSECustomerKey: string;
        SSECustomerKeyMD5: string;
        SSECustomerAlgorithm: 'AES256';
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
        SSECustomerKey,
        SSECustomerKeyMD5,
        SSECustomerAlgorithm: 'AES256',
      };
    }

    this.expiresInSeconds = config.s3.signedUrlDurationSeconds;
    this.bucketName = config.s3.bucket;
    this.client = new S3Client({
      maxAttempts: 3,
      region: config.s3.region,
      credentials: config.s3.credentials,
      endpoint: config.s3.endpoint,
      forcePathStyle: config.s3.forcePathStyle,
    });
  }

  @Transactional(Propagation.RequiresNew)
  async getPublicUrls(fileIds: readonly string[]): Promise<{ [fileId: string]: URL }> {
    if (fileIds.length === 0) return {};

    const files = await this.db.tx.file.findMany({
      where: { id: { in: fileIds as string[] } },
      select: {
        id: true,
        name: true,
        path: true,
        filePublicUrls: {
          where: { expiresAt: { gt: this.clock.now() } },
          select: { id: true, url: true, expiresAt: true },
          orderBy: [{ expiresAt: 'desc' }],
          take: 1,
        },
      },
    });

    const publicUrls = await Promise.allSettled(
      files.map((file) => {
        const publicUrl = file.filePublicUrls[0];
        if (publicUrl) {
          return Promise.resolve({
            ...publicUrl,
            fileId: file.id,
            publicUrl: new URL(`${process.env.ORIGIN_URL}/api/files/v1/${publicUrl.id}`),
            existing: true,
          });
        }

        return this.generatePublicUrl(file);
      }),
    ).then((result) => result.filter(isFulfilled).map(({ value }) => value));

    await this.db.tx.filePublicUrl.createMany({
      data: publicUrls
        .filter((x) => !('existing' in x))
        .map((x) => ({
          id: x.id,
          url: x.url.toString(),
          fileId: x.fileId,
          expiresAt: x.expiresAt,
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
            Bucket: this.bucketName,
            Key: encodeURI(path),
            Body: passthrough,
            ContentType: file.mimeType,
            Metadata: Object.fromEntries(
              Object.entries(file.meta ?? {}).filter((entry): entry is [string, string] => !!entry[1]),
            ),
          },
        });

        fileStoragePromises.push({
          file: { ...file, path },
          promise: Sentry.startSpan(
            {
              name: 'fr.csm.fondation:files:create_single',
              attributes: {
                'file.name': file.name,
                'file.type': file.mimeType,
              },
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
        span.recordException(error);
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
          name: file.name,
          path: file.path.split('/'),
          id: file.meta?.id ?? makeId('FileId'),
          bucket: this.bucketName,
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

  /** this is a best effort request to delete the files */
  delete(files: readonly { id: string; path: readonly string[] }[]): void {
    ignoreAsync(() =>
      Sentry.startSpan(
        {
          name: 'fr.csm.fondation:files:delete',
          attributes: { objectsCount: files.length },
        },
        () => this._delete(files),
      ),
    );
  }

  private async _delete(files: readonly ({ id: string; path: readonly string[] } | string)[]): Promise<void> {
    if (files.length === 0) return;
    try {
      const response = await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucketName,
          Delete: {
            Objects: files.map((file) => ({
              Key: typeof file === 'string' ? encodeURI(file) : encodeURI(file.path.join('/')),
            })),
          },
        }),
      );

      if ((response.Errors?.length ?? 0) > 0) {
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
                Quiet: true,
                Objects: versionsToDelete.filter((path) => !!path.Key),
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
  ): Promise<{ file: StreamableFile; expiresAt: Date }> {
    const file = await this.db.withTransaction(() =>
      this.db.tx.filePublicUrl.findUnique({
        where: { id: fileUrlId, expiresAt: { gt: this.clock.now() } },
        select: { url: true, expiresAt: true, file: { select: { name: true } } },
      }),
    );

    if (!file) throw new NotFoundException();

    let headers: Record<string, string> = {};
    if (this.hasSse) {
      const { SSECustomerAlgorithm, SSECustomerKey, SSECustomerKeyMD5 } = this.sseHeaders;

      headers = {
        'x-amz-server-side-encryption-customer-key': SSECustomerKey,
        'x-amz-server-side-encryption-customer-key-MD5': SSECustomerKeyMD5,
        'x-amz-server-side-encryption-customer-algorithm': SSECustomerAlgorithm,
      };
    }

    const response = await lastValueFrom(
      this.http.get(file.url, {
        headers,
        responseType: 'stream',
      }),
    );

    return {
      expiresAt: file.expiresAt,
      file: new StreamableFile(response.data, {
        type: filenameToMimeType(file.file.name),
        disposition: `${options?.download ? 'attachment' : 'inline'}; filename="${encodeURIComponent(file.file.name)}"`,
      }),
    };
  }

  @Transactional()
  async getFile(props: { fileId: string }): Promise<Readable | null> {
    const storedFile = await this.db.tx.file.findUnique({
      where: { id: props.fileId },
      select: { path: true },
    });

    if (!storedFile) return null;

    const command = new GetObjectCommand({
      ...this.sseHeaders,
      Bucket: this.bucketName,
      Key: encodeURI(storedFile.path.join('/')),
    });

    const response = await this.client.send(command);
    if (!response.Body) throw new Error('Not Found');

    return assertIsDefined(response.Body as Readable | undefined, `file ${props.fileId} not found`);
  }

  private async generatePublicUrl(file: { id: string; path: readonly string[] }): Promise<{
    publicUrl: URL;
    url: URL;
    id: string;
    expiresAt: Date;
    fileId: string;
  }> {
    const id = makeId('FilePublicUrlId');
    const publicUrl = new URL(`${process.env.ORIGIN_URL}/api/files/v1/${id}`);
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

    return { fileId: file.id, id, url, expiresAt, publicUrl };
  }

  async onApplicationBootstrap(): Promise<void> {
    if (this.config.isProduction) {
      // TODO: shouldn't we create it to ease things?
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
              AllowedOrigins: [this.config.originUrl],
              AllowedHeaders: ['*'],
              ExposeHeaders: ['ETag'],
              AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
              MaxAgeSeconds: (12 * time.HOURS) / time.SECONDS,
            },
            {
              AllowedOrigins: [this.config.frontendOriginUrl],
              AllowedHeaders: ['*'],
              ExposeHeaders: ['ETag'],
              AllowedMethods: ['GET', 'HEAD'],
              MaxAgeSeconds: (12 * time.HOURS) / time.SECONDS,
            },
          ],
        },
      }),
    );
  }
}
