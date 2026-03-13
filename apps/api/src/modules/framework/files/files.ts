import { createHash } from 'node:crypto';
import { inspect } from 'node:util';

import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  ListObjectVersionsCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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

import { HttpService } from '@nestjs/axios';
import { PrismaStorageProviderEnum } from 'src/generated/prisma/enums';
import { API_CONFIG_TOKEN, type ApiConfig } from 'src/modules/framework/config';
import { PrismaService } from 'src/modules/framework/database';

import { makeId } from 'src/utils/id';
import { isDefined } from 'src/utils/is-defined';
import { noop } from 'src/utils/noop';
import { ignoreAsync, isFulfilled, partitionSettled } from 'src/utils/promises';
import * as time from 'src/utils/time';

import { Clock } from '../clock';
import { type FondationFile } from './files.types';
import { filenameToMimeType } from './mime-type';

/** @internal */
class RollbackFilePathOperationError {
  constructor(
    readonly filesToDelete:
      | readonly string[]
      | readonly { id: string; path: readonly string[] }[],
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
    private readonly prisma: PrismaService,
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

  async getPublicUrls(
    fileIds: readonly string[],
  ): Promise<{ [fileId: string]: URL }> {
    if (fileIds.length === 0) return {};

    return this.prisma.$transaction(async (tx) => {
      const files = await tx.file.findMany({
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
            return {
              ...publicUrl,
              fileId: file.id,
              publicUrl: new URL(
                `${process.env.ORIGIN_URL}/api/files/v1/${publicUrl.id}`,
              ),
              existing: true,
            };
          }

          return this.generatePublicUrl(file);
        }),
      ).then((result) => result.filter(isFulfilled).map(({ value }) => value));

      await tx.filePublicUrl.createMany({
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
    });
  }

  create(files: readonly FondationFile[]): Promise<string[]> {
    if (files.length === 0) return Promise.resolve([]);

    return Sentry.startSpan(
      {
        name: 'fr.csm.fondation:files:create',
        attributes: Object.fromEntries(
          files
            .flatMap((file, i) => [
              [`file.${i}.size`, file.buffer.byteLength],
              [`file.${i}.type`, file.mimeType],
            ])
            .concat([['objectsCount', files.length]]),
        ),
      },
      () => this._create(files),
    );
  }

  private async _create(files: readonly FondationFile[]): Promise<string[]> {
    try {
      const { fulfilled, rejected } = await Promise.allSettled(
        files.map((file) =>
          this.client
            .send(
              new PutObjectCommand({
                ...this.sseHeaders,
                Key: encodeURI(file.path),
                Bucket: this.bucketName,
                Metadata: Object.fromEntries(
                  Object.entries(file.meta ?? {}).filter(
                    (entry): entry is [string, string] => !!entry[1],
                  ),
                ),
                ContentType: file.mimeType,
                Body: file.buffer,
              }),
            )
            .then(() => file.path),
        ),
      ).then(partitionSettled);

      if (rejected.length > 0) {
        this.logger.warn(
          `Failed uploading ${rejected.length} files
          ${inspect(rejected.map((x) => x.reason))}`,
        );

        throw new RollbackFilePathOperationError(
          fulfilled.map(({ value }) => value),
          new InternalServerErrorException(
            `Failure uploading ${rejected.length} files`,
          ),
        );
      }

      const filesWithId = files.map((file) => {
        file.meta = { ...(file.meta ?? {}) };
        file.meta.id = file.meta.id ?? makeId('FileId');
        return file;
      });

      await this.prisma.file
        .createMany({
          data: filesWithId.map((file) => {
            const path = file.path.split('/').filter((x) => !!x.trim());

            return {
              path,
              name: file.name,
              id: file.meta?.id,
              bucket: this.bucketName,
              storageProvider: PrismaStorageProviderEnum.SCALEWAY,
            };
          }),
        })
        .catch((err) => {
          this.logger.warn(
            `Failed uploading ${files.length} files: ${inspect(err)}`,
          );

          throw new RollbackFilePathOperationError(
            files.map(({ path }) => path),
            new InternalServerErrorException(
              `Failed uploading ${files.length} files`,
              { cause: err },
            ),
          );
        });

      return filesWithId.map(({ meta }) => meta?.id).filter(isDefined);
    } catch (err) {
      if (err instanceof RollbackFilePathOperationError) {
        this._delete(err.filesToDelete);
        throw err.cause;
      }

      throw err;
    }
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

  private async _delete(
    files:
      | readonly { id: string; path: readonly string[] }[]
      | readonly string[],
  ): Promise<void> {
    if (files.length === 0) return;
    try {
      const response = await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucketName,
          Delete: {
            Objects: files.map((file) => ({
              Key:
                typeof file === 'string'
                  ? encodeURI(file)
                  : encodeURI(file.path.join('/')),
            })),
          },
        }),
      );

      if ((response.Errors?.length ?? 0) > 0) {
        const deletedPaths = (response.Deleted ?? [])
          .filter((d) => d.DeleteMarker)
          .map((d) => ({ Key: d.Key, VersionId: d.DeleteMarkerVersionId }));

        this.logger.warn(
          `Failed deleting ${response.Errors?.length ?? 0} files ${inspect(response.Errors)}`,
        );

        throw new RollbackDeleteFilesCommandError(
          deletedPaths,
          new InternalServerErrorException(
            `failed deleting ${response.Errors?.length ?? 0} files`,
          ),
        );
      }

      await this.prisma
        .$transaction(
          files.map((file) => {
            if (typeof file === 'string') {
              const path = file.split('/');
              return this.prisma.file.deleteMany({
                where: { bucket: this.bucketName, path: { equals: path } },
              });
            }

            return this.prisma.file.delete({ where: { id: file.id } });
          }),
        )
        .catch((err) => {
          throw new RollbackFilePathOperationError(
            files,
            new InternalServerErrorException(
              `failed deleting ${files.length} files`,
              err,
            ),
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
                  Prefix:
                    typeof file === 'string'
                      ? encodeURI(file)
                      : encodeURI(file.path.join('/')),
                }),
              );
              const lastDeleted = objectVersion.DeleteMarkers?.find(
                (v) => v.IsLatest,
              );

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
  ): Promise<{ file: StreamableFile; expiresAt: Date }> {
    const file = await this.prisma.filePublicUrl.findUnique({
      where: { id: fileUrlId, expiresAt: { gt: this.clock.now() } },
      select: { url: true, expiresAt: true, file: { select: { name: true } } },
    });

    if (!file) throw new NotFoundException();

    let headers: Record<string, string> = {};
    if (this.hasSse) {
      const { SSECustomerAlgorithm, SSECustomerKey, SSECustomerKeyMD5 } =
        this.sseHeaders;

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
        disposition: `inline; filename="${encodeURIComponent(file.file.name)}"`,
      }),
    };
  }

  private async generatePublicUrl(file: {
    id: string;
    path: readonly string[];
  }): Promise<{
    publicUrl: URL;
    url: URL;
    id: string;
    expiresAt: Date;
    fileId: string;
  }> {
    const id = makeId('FilePublicUrlId');
    const publicUrl = new URL(`${process.env.ORIGIN_URL}/api/files/v1/${id}`);
    const expiresAt = new Date(
      this.clock.now().getTime() + this.expiresInSeconds * time.SECONDS,
    );
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
