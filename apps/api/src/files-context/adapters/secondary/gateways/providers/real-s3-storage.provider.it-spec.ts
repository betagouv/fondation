import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { join } from 'path';
import { FileDocumentBuilder } from 'src/files-context/business-logic/builders/file-document.builder';
import { S3Commands } from 'src/files-context/business-logic/gateways/providers/s3-commands';
import { FileDocument } from 'src/files-context/business-logic/models/file-document';
import { S3Config } from 'src/shared-kernel/adapters/primary/zod/api-config-schema';
import { defaultApiConfig } from 'src/shared-kernel/adapters/primary/nestjs/env';
import { deleteS3Files, givenSomeS3Files } from 'test/minio';
import { MinioS3Commands } from './minio-s3-commands';
import { minioS3StorageClient } from './minio-s3-sorage.client';
import { RealS3StorageProvider } from './real-s3-storage.provider';
import { ScalewayS3Commands } from './scaleway-s3-commands';
import { scalewayS3StorageClient } from './scaleway-s3-sorage.client';

const minioS3Commands = new MinioS3Commands();
const scalewayS3Commands = new ScalewayS3Commands(defaultApiConfig);

const bucket = defaultApiConfig.s3.reportsContext.attachedFilesBucketName;

describe.each`
  providerName  | s3Client                   | s3Commands            | s3Config
  ${'MinIO'}    | ${minioS3StorageClient}    | ${minioS3Commands}    | ${defaultApiConfig.s3.minio}
  ${'Scaleway'} | ${scalewayS3StorageClient} | ${scalewayS3Commands} | ${defaultApiConfig.s3.scaleway}
`(
  '$providerName S3 Storage Provider',
  ({
    providerName,
    s3Client,
    s3Commands,
    s3Config,
  }: {
    providerName: 'MinIO' | 'Scaleway';
    s3Client: S3Client;
    s3Commands: S3Commands;
    s3Config: S3Config;
  }) => {
    let s3StorageProvider: RealS3StorageProvider;

    beforeEach(async () => {
      s3StorageProvider = new RealS3StorageProvider(
        s3Client,
        defaultApiConfig,
        s3Commands,
      );
    });

    afterEach(
      async () => {
        await deleteS3Files(s3Client);
        // Scaleway has high latency from time to time.
      },
      providerName === 'Scaleway' ? 40000 : undefined,
    );

    const buildS3SignedUrl = (Key: string) => {
      const { scheme, baseDomain } = s3Config.endpoint;

      switch (providerName) {
        case 'Scaleway':
          return `${scheme}://${bucket}.${baseDomain}/${Key}`;
        case 'MinIO':
          return `${scheme}://${baseDomain}/${bucket}/${Key}`;
        default:
          throw new Error(`Unsupported provider name: ${providerName}`);
      }
    };

    describe.each`
      filePath
      ${null}
      ${['folder', 'subfolder']}
    `(
      'With file path $filePath',
      ({ filePath }: { filePath: string[] | null }) => {
        const Key = join(...(filePath || []), 'file-name.txt');
        const aFile = new FileDocumentBuilder()
          .with('id', 'file-id')
          .with('bucket', bucket)
          .with('name', 'file-name.txt')
          .with('path', filePath)
          .with('signedUrl', buildS3SignedUrl(Key))
          .build();

        it(
          'saves a file',
          async () => {
            expect(
              await s3StorageProvider.uploadFile(
                Buffer.from('file content'),
                aFile.name,
                'text/plain',
                bucket,
                aFile.path,
              ),
            ).toBeUndefined();
          },
          // Scaleway has high latency from time to time.
          providerName === 'Scaleway' ? 30000 : undefined,
        );

        it('fails to get a signed URL for a missing file', async () => {
          await expect(
            s3StorageProvider.getSignedUrls([FileDocument.fromSnapshot(aFile)]),
          ).rejects.toThrow();
        });
      },
    );

    describe('When there is already one file', () => {
      const filePath = ['folder'];
      const Key = join(...filePath, 'file-name.txt');

      const aFile = new FileDocumentBuilder()
        .with('id', 'file-id')
        .with('bucket', bucket)
        .with('name', 'file-name.txt')
        .with('path', ['folder'])
        .with('signedUrl', buildS3SignedUrl(Key))
        .build();

      beforeEach(
        async () => {
          await givenSomeS3Files(s3Client, {
            bucket,
            Key,
          });
        },
        // Scaleway has high latency from time to time.
        providerName === 'Scaleway' ? 30000 : undefined,
      );

      it(
        'gets the signed URL',
        async () => {
          const filesVM = await s3StorageProvider.getSignedUrls([
            FileDocument.fromSnapshot(aFile),
          ]);
          expect(filesVM.length).toBePositive();

          expect(filesVM.map((fileVM) => fileVM.name)).toEqual([aFile.name]);
          const signedUrls = filesVM.map((file) => new URL(file.signedUrl));
          for (const url of signedUrls) {
            expectSignedUrl({
              url,
              expectedSignedUrl: aFile.signedUrl!,
            });
          }
        },
        // Scaleway has high latency from time to time.
        providerName === 'Scaleway' ? 30000 : undefined,
      );

      it(
        'deletes the file',
        async () => {
          await s3StorageProvider.deleteFile(bucket, filePath, aFile.name);
          await expect(
            s3Client.send(
              new HeadObjectCommand({
                Bucket: bucket,
                Key,
              }),
            ),
          ).rejects.toBeDefined();
        },
        // Scaleway has high latency from time to time.
        providerName === 'Scaleway' ? 30000 : undefined,
      );

      const expectSignedUrl = ({
        url,
        expectedSignedUrl,
      }: {
        url: URL;
        expectedSignedUrl: string;
      }) => {
        expect(url.origin + url.pathname).toEqual(expectedSignedUrl);
        expect(url.searchParams.get('X-Amz-Algorithm')).toEqual(
          'AWS4-HMAC-SHA256',
        );
        expect(url.searchParams.get('X-Amz-Credential')).toEqual(
          expect.anything(),
        );
        expect(url.searchParams.get('X-Amz-Expires')).toEqual('3600');
        expect(url.searchParams.get('X-Amz-Signature')).toEqual(
          expect.any(String),
        );
      };
    });
  },
  // Scaleway has high latency from time to time.
  40000,
);
