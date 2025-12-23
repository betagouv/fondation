import { createHash } from 'node:crypto';

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
  InternalServerErrorException,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';

import { PrismaStorageProviderEnum } from 'src/generated/prisma/enums';
import { type ApiConfig } from 'src/modules/framework/config';
import { PrismaService } from 'src/modules/framework/database';

import { isDefined } from 'src/utils/is-defined';
import { noop } from 'src/utils/noop';
import { ignoreAsync, isFulfilled, partitionSettled } from 'src/utils/promises';
import * as time from 'src/utils/time';

import { inspect } from 'node:util';
import { makeId } from 'src/utils/id';
import { type FondationFile } from './files.types';
import { filenameToMimeType } from './mime-type';

/** @internal */
class RollbackFilePathOperationError {
  constructor(
    readonly pathsToDelete: readonly string[],
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
 * It synchronizes our database table "files_context"."files" and the bucket it wraps.
 *
 * Design elements:
 *  - lean API, we limit the number of operations possible, always on a list of files
 *  - dual writes operations, if any fails we try to rollback the operations (in best effort)
 */
export class Files implements OnApplicationBootstrap {
  private readonly logger = new Logger(Files.name);

  private readonly originUrl: string;
  private readonly frontendOriginUrl: string;
  private readonly expiresInSeconds: number;
  private readonly sseHeaders:
    | {
        SSECustomerKey: string;
        SSECustomerKeyMD5: string;
        SSECustomerAlgorithm: 'AES256';
      }
    | Record<string, never> = {};

  constructor(
    private readonly client: S3Client,
    private readonly prisma: PrismaService,
    private readonly bucketName: string,
    config: ApiConfig,
    sseConfig: { base64Key: string; algorithm: 'AES256' } | undefined,
  ) {
    this.originUrl = config.originUrl;
    this.frontendOriginUrl = config.frontendOriginUrl;
    this.expiresInSeconds = config.s3.signedUrlExpiresIn;

    if (sseConfig) {
      const { base64Key: SSECustomerKey, algorithm: SSECustomerAlgorithm } =
        sseConfig;
      const SSECustomerKeyMD5 = createHash('md5')
        .update(SSECustomerKey)
        .digest('base64');
      this.sseHeaders = {
        SSECustomerKey,
        SSECustomerAlgorithm,
        SSECustomerKeyMD5,
      };
    }
  }

  async getPublicUrls(
    files: readonly { path: string; name: string }[],
  ): Promise<{ [filePath: string]: URL }> {
    const entries = await Promise.allSettled(
      files.map(
        async (file) =>
          [
            file.path,
            await getSignedUrl(
              this.client,
              new GetObjectCommand({
                ...this.sseHeaders,
                ResponseContentType: filenameToMimeType(file.name),
                ResponseContentDisposition: `inline; filename="${file.name}"`,
                Bucket: this.bucketName,
                Key: encodeURI(file.path),
              }),
              { expiresIn: this.expiresInSeconds },
            ).then((url) => new URL(url)),
          ] as const,
      ),
    ).then((result) => result.filter(isFulfilled).map(({ value }) => value));

    return Object.fromEntries(entries);
  }

  async create(files: readonly FondationFile[]): Promise<string[]> {
    if (files.length === 0) return [];

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
            const path = file.path.split('/');

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
        ignoreAsync(() => this.delete(err.pathsToDelete).catch(noop));
        throw err.cause;
      }

      throw err;
    }
  }

  async delete(filePaths: readonly string[]): Promise<void> {
    if (filePaths.length === 0) return;
    try {
      const response = await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucketName,
          Delete: {
            Objects: filePaths.map((filePath) => ({
              Key: encodeURI(filePath),
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
          filePaths.map((file) => {
            const path = file.split('/');
            return this.prisma.file.deleteMany({
              where: { bucket: this.bucketName, path: { equals: path } },
            });
          }),
        )
        .catch((err) => {
          throw new RollbackFilePathOperationError(
            filePaths,
            new InternalServerErrorException(
              `failed deleting ${filePaths.length} files`,
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
          for (const path of err.pathsToDelete) {
            try {
              const objectVersion = await this.client.send(
                new ListObjectVersionsCommand({
                  Bucket: this.bucketName,
                  Prefix: encodeURI(path),
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

  async onApplicationBootstrap(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
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
              AllowedOrigins: [this.originUrl],
              AllowedHeaders: ['*'],
              ExposeHeaders: ['ETag'],
              AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
              MaxAgeSeconds: (12 * time.HOURS) / time.SECONDS,
            },
            {
              AllowedOrigins: [this.frontendOriginUrl],
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
