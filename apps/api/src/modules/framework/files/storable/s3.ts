import { createHash } from 'node:crypto';

import { HeadBucketCommand, PutBucketCorsCommand, S3Client as S3 } from '@aws-sdk/client-s3';
import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';

import { API_CONFIG_TOKEN, ApiConfig } from '../../config';
import * as time from 'src/utils/time';

import { StorablePath } from './storable.types';

@Injectable()
export class S3Client implements Pick<S3, 'send'>, OnApplicationBootstrap {
  readonly client: S3;

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

  readonly send: S3['send'];

  constructor(
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
    this.client = new S3({
      maxAttempts: 3,
      region: config.s3.region,
      credentials: config.s3.credentials,
      endpoint: config.s3.endpoint,
      forcePathStyle: config.s3.forcePathStyle,
    });

    this.send = this.client.send.bind(this.client);
  }

  buildCommand<T>(
    builder: (helper: {
      key: (stored: { path: StorablePath }) => string;
      command: {
        Bucket: string;
        SSECustomerKey?: string;
        SSECustomerKeyMD5?: string;
        SSECustomerAlgorithm?: string;
      };
    }) => T,
  ): T {
    return builder({ key: S3Client.buildKey, command: { Bucket: this.bucketName, ...this.sseHeaders } });
  }

  private static buildKey(stored: { path: StorablePath }): string {
    return encodeURI(stored.path.join('/'));
  }

  async onApplicationBootstrap() {
    if (this.config.isProduction) {
      await this.ensureBucketExists();
      await this.putBucketCors();
    }
  }

  private async ensureBucketExists(): Promise<void> {
    await this.send(this.buildCommand(({ command }) => new HeadBucketCommand(command)));
  }

  private async putBucketCors(): Promise<void> {
    await this.send(
      this.buildCommand(
        ({ command }) =>
          new PutBucketCorsCommand({
            ...command,
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
      ),
    );
  }
}
