import { S3Client } from '@aws-sdk/client-s3';
import { Global, Module } from '@nestjs/common';

import { API_CONFIG_TOKEN, ApiConfig } from '../config';
import { PrismaService } from '../database';

import { Files } from './files';
import { StoreFileInterceptor } from './multipart/store-file.interceptor';
import { Sanitizer } from './sanitizers';

export const SSE_CONFIG_TOKEN = Symbol();

@Global()
@Module({
  exports: [Files, Sanitizer],
  providers: [
    Sanitizer,
    StoreFileInterceptor,
    {
      provide: S3Client,
      inject: [API_CONFIG_TOKEN],
      useFactory: ({ s3 }: ApiConfig) => {
        // TODO:
        //  since both minio and scaleway have the same configuration schema,
        //  we should simply rely on a S3 configuration, and not a minio or scaleway one
        //  preventing these `NODE_ENV === 'production' shenanigans
        if (process.env.NODE_ENV === 'production') {
          return new S3Client({
            maxAttempts: 3,
            region: s3.scaleway.region,
            credentials: s3.scaleway.credentials,
            endpoint: `${s3.scaleway.endpoint.scheme}://${s3.scaleway.endpoint.baseDomain}`,
          });
        }

        if (!('minio' in s3)) {
          throw new Error(`Missing minio configuration`);
        }

        return new S3Client({
          maxAttempts: 3,
          region: 'eu-west-2',
          forcePathStyle: true,
          credentials: s3.minio.credentials,
          endpoint: `${s3.minio.endpoint.scheme}://${s3.minio.endpoint.baseDomain}`,
        });
      },
    },
    {
      provide: SSE_CONFIG_TOKEN,
      inject: [API_CONFIG_TOKEN],
      useFactory(config: ApiConfig) {
        return process.env.NODE_EN === 'production'
          ? {
              algorithm: 'AE256',
              base64Key: config.s3.scaleway.encryptionKeyBase64,
            }
          : undefined;
      },
    },
    {
      provide: Files,
      inject: [S3Client, PrismaService, API_CONFIG_TOKEN, SSE_CONFIG_TOKEN],
      useFactory: (
        client: S3Client,
        prisma: PrismaService,
        config: ApiConfig,
        sseConfig: { base64Key: string; algorithm: 'AES256' } | undefined,
      ) => {
        const bucketName = config.s3.reportsContext.attachedFilesBucketName;
        return new Files(client, prisma, bucketName, config, sseConfig);
      },
    },
  ],
})
export class FilesModule {}
