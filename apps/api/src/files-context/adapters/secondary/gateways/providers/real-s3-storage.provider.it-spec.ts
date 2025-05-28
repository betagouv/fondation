import {
  DeleteObjectCommand,
  GetBucketCorsCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { join } from 'path';
import { FileDocumentBuilder } from 'src/files-context/business-logic/builders/file-document.builder';
import { S3Commands } from 'src/files-context/business-logic/gateways/providers/s3-commands';
import { FileDocument } from 'src/files-context/business-logic/models/file-document';
import { defaultApiConfig } from 'src/shared-kernel/adapters/primary/nestjs/env';
import { S3Config } from 'src/shared-kernel/adapters/primary/zod/api-config-schema';
import { deleteS3Files, givenSomeS3Files } from 'test/minio';
import { MinioS3Commands } from './minio-s3-commands';
import { minioS3StorageClient } from './minio-s3-sorage.client';
import { RealS3StorageProvider } from './real-s3-storage.provider';

const minioS3Commands = new MinioS3Commands();

const bucket = defaultApiConfig.s3.reportsContext.attachedFilesBucketName;

// We don't use Scaleway in the CI at the moment, because we have a long latency
// problem only in CI. It seems unrelated to rate limiting.
// const scalewayS3Commands = new ScalewayS3Commands(defaultApiConfig);
// ${'Scaleway'} | ${scalewayS3StorageClient} | ${scalewayS3Commands} | ${defaultApiConfig.s3.scaleway}
describe.each`
  providerName | s3Client                | s3Commands         | s3Config
  ${'MinIO'}   | ${minioS3StorageClient} | ${minioS3Commands} | ${defaultApiConfig.s3.minio}
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
      },
      // Scaleway has high latency from time to time.
      providerName === 'Scaleway' ? 40000 : undefined,
    );

    const buildS3SignedUrl = (
      fileName: string,
      filePath: string[] | null = null,
    ) => {
      const { scheme, baseDomain } = s3Config.endpoint;
      const Key = join(...(filePath || []), encodeURIComponent(fileName));

      switch (providerName) {
        case 'Scaleway':
          return `${scheme}://${bucket}.${baseDomain}/${Key}`;
        case 'MinIO':
          return `${scheme}://${baseDomain}/${bucket}/${Key}`;
        default:
          throw new Error(`Unsupported provider name: ${providerName}`);
      }
    };

    it("n'a aucune policy CORS par défaut", async () => {
      await expect(
        minioS3StorageClient.send(
          new GetBucketCorsCommand({
            Bucket:
              defaultApiConfig.s3.nominationsContext
                .transparenceFilesBucketName,
          }),
        ),
      ).rejects.toThrow();
    });

    it.skip('Setup de la policy CORS', async () => {
      // Intestable avec minio, la commande d'update de la policy CORS n'est pas supportée.
      // https://github.com/minio/minio/issues/15874#issuecomment-1279771751
    });

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
          .with('signedUrl', buildS3SignedUrl('file-name.txt', filePath))
          .build();

        it('uploads a file', async () => {
          expect(await uploadFile(aFile.name, aFile.path)).toBeUndefined();
          await expectUploadedFile(Key);
        });

        it('fails to get a signed URL for a missing file', async () => {
          await expect(
            s3StorageProvider.getSignedUrls([FileDocument.fromSnapshot(aFile)]),
          ).rejects.toThrow();
        });
      },
    );

    describe('With accents in file name', () => {
      const aFile = new FileDocumentBuilder()
        .with('bucket', bucket)
        .with('path', null)
        .with('name', 'file-ÃªÉêéèàùïôâŒ-name.txt')
        .build();
      const encodedFileName =
        'file-%C3%83%C2%AA%C3%89%C3%AA%C3%A9%C3%A8%C3%A0%C3%B9%C3%AF%C3%B4%C3%A2%C5%92-name.txt';

      it('uploads it', async () => {
        expect(await uploadFile(aFile.name)).toBeUndefined();
        await expectUploadedFile(encodedFileName);
      });

      describe('File already uploaded', () => {
        beforeEach(async () => {
          await givenSomeS3Files(s3Client, {
            bucket,
            Key: encodedFileName,
          });
        });

        it('gets the signed URL', async () => {
          const filesVM = await s3StorageProvider.getSignedUrls([
            FileDocument.fromSnapshot(aFile),
          ]);
          expect(filesVM.length).toBePositive();

          expect(filesVM.map((fileVM) => fileVM.name)).toEqual([aFile.name]);
          const signedUrls = filesVM.map((file) => new URL(file.signedUrl));
          for (const url of signedUrls) {
            expectSignedUrl({
              url,
              expectedSignedUrl: buildS3SignedUrl(encodedFileName),
            });
          }
        });

        it(
          'deletes the file',
          async () => {
            await s3StorageProvider.deleteFile(bucket, null, aFile.name);
            await expect(
              s3Client.send(
                new HeadObjectCommand({
                  Bucket: bucket,
                  Key: aFile.name,
                }),
              ),
            ).rejects.toBeDefined();
          },
          // Scaleway has high latency from time to time.
          providerName === 'Scaleway' ? 30000 : undefined,
        );
      });
    });

    it('uploads two files', async () => {
      const firstFileName = 'first-file.txt';
      const secondFileName = 'second-file.txt';

      const results = await s3StorageProvider.uploadFiles([
        {
          file: Buffer.from(''),
          fileName: firstFileName,
          mimeType: 'text/plain',
          bucket,
          filePath: null,
        },
        {
          file: Buffer.from(''),
          fileName: secondFileName,
          mimeType: 'text/plain',
          bucket,
          filePath: null,
        },
      ]);

      expect(results.every((result) => result.status === 'fulfilled')).toBe(
        true,
      );
      await expectUploadedFile(firstFileName);
      await expectUploadedFile(secondFileName);
    });

    describe('When there is already one file', () => {
      const filePath = ['folder'];
      const Key = join(...filePath, 'file-name.txt');

      const aFile = new FileDocumentBuilder()
        .with('id', 'file-id')
        .with('bucket', bucket)
        .with('name', 'file-name.txt')
        .with('path', ['folder'])
        .with('signedUrl', buildS3SignedUrl('file-name.txt', filePath))
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

      describe('when there is a second file', () => {
        const secondFilePath = ['folder'];
        const secondKey = join(...secondFilePath, 'second-file.txt');

        const secondFile = new FileDocumentBuilder()
          .with('id', 'second-file-id')
          .with('bucket', bucket)
          .with('name', 'second-file.txt')
          .with('path', secondFilePath)
          .with(
            'signedUrl',
            buildS3SignedUrl('second-file.txt', secondFilePath),
          )
          .build();

        beforeEach(
          async () => {
            await givenSomeS3Files(s3Client, {
              bucket,
              Key: secondKey,
            });
          },
          // Scaleway has high latency from time to time.
          providerName === 'Scaleway' ? 30000 : undefined,
        );

        it('deletes multiple files', async () => {
          const results = await s3StorageProvider.deleteFiles([
            FileDocument.fromSnapshot(aFile),
            FileDocument.fromSnapshot(secondFile),
          ]);

          expect(results.every((result) => result.status === 'fulfilled')).toBe(
            true,
          );

          await expectDeletedFile(Key);
          await expectDeletedFile(secondKey);
        });

        it('restores a file', async () => {
          await s3Client.send(
            new DeleteObjectCommand({
              Bucket: bucket,
              Key,
            }),
          );

          await s3StorageProvider.restoreFiles([
            FileDocument.fromSnapshot(aFile),
          ]);

          await expectUploadedFile(Key);
          await expectUploadedFile(secondKey);
        });
      });
    });

    const uploadFile = (fileName: string, filePath: string[] | null = null) =>
      s3StorageProvider.uploadFile(
        Buffer.from('file content'),
        fileName,
        'text/plain',
        bucket,
        filePath,
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

    async function expectDeletedFile(Key: string) {
      await expect(
        s3Client.send(
          new HeadObjectCommand({
            Bucket: bucket,
            Key,
          }),
        ),
      ).rejects.toBeDefined();
    }

    async function expectUploadedFile(Key: string) {
      await expect(
        s3Client.send(
          new HeadObjectCommand({
            Bucket: bucket,
            Key,
          }),
        ),
      ).resolves.toBeDefined();
    }
  },
  // Scaleway has high latency from time to time.
  40000,
);
