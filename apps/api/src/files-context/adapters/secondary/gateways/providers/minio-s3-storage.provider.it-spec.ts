import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { join } from 'path';
import { FileDocumentBuilder } from 'src/files-context/business-logic/builders/file-document.builder';
import { FileDocument } from 'src/files-context/business-logic/models/file-document';
import { defaultApiConfig } from 'src/shared-kernel/adapters/primary/nestjs/env';
import {
  createMinioBucket,
  deleteMinioBuckets,
  givenSomeS3Files,
} from 'test/minio';
import { MinioS3Commands } from './minio-s3-commands';
import { minioS3StorageClient } from './minio-s3-sorage.client';
import { RealS3StorageProvider } from './real-s3-storage.provider';

describe('MinIO S3 Storage Provider', () => {
  let s3StorageProvider: RealS3StorageProvider;

  beforeEach(async () => {
    s3StorageProvider = new RealS3StorageProvider(
      minioS3StorageClient,
      defaultApiConfig,
      new MinioS3Commands(),
    );
  });

  afterEach(async () => {
    await deleteMinioBuckets();
  });

  describe.each`
    bucketExists | bucket               | filePath
    ${false}     | ${'existing-bucket'} | ${null}
    ${true}      | ${'new-bucket'}      | ${['folder', 'subfolder']}
  `(
    'When a bucket exists = $bucketExists',
    ({
      bucketExists,
      bucket,
      filePath,
    }: {
      bucketExists: boolean;
      bucket: string;
      filePath: string[] | null;
    }) => {
      const Key = join(...(filePath || []), 'file-name.txt');
      const aFile = new FileDocumentBuilder()
        .with('id', 'file-id')
        .with('bucket', bucket)
        .with('name', 'file-name.txt')
        .with('path', filePath)
        .with('signedUrl', `${defaultApiConfig.s3.endpoint}/${bucket}/${Key}`)
        .build();

      beforeEach(async () => {
        if (bucketExists) await createMinioBucket(bucket);
      });

      it(
        bucket === 'existing-bucket'
          ? 'saves a file'
          : 'creates the bucket and saves a file',
        async () => {
          await expect(
            s3StorageProvider.uploadFile(
              Buffer.from('file content'),
              aFile.name,
              'text/plain',
              bucket,
              aFile.path,
            ),
          ).resolves.toBeUndefined();
        },
      );

      it('fails to get a signed URL for a missing file', async () => {
        await expect(
          s3StorageProvider.getSignedUrls([FileDocument.fromSnapshot(aFile)]),
        ).rejects.toThrow();
      });
    },
  );

  describe('When there is already one file', () => {
    const bucket = 'fondation-bucket';
    const filePath = ['folder'];
    const Key = join(...filePath, 'file-name.txt');

    const aFile = new FileDocumentBuilder()
      .with('id', 'file-id')
      .with('bucket', bucket)
      .with('name', 'file-name.txt')
      .with('path', ['folder'])
      .with('signedUrl', `${defaultApiConfig.s3.endpoint}/${bucket}/${Key}`)
      .build();

    beforeEach(async () => {
      await createMinioBucket(bucket);
      await givenSomeS3Files({
        bucket,
        Key,
      });
    });

    it('gets the signed URL', async () => {
      const filesVM = await s3StorageProvider.getSignedUrls([
        FileDocument.fromSnapshot(aFile),
      ]);
      expect(filesVM.length).toBePositive();

      expect(filesVM.map((fileVM) => fileVM.name)).toEqual([aFile.name]);
      const signedUrls = filesVM.map((file) => new URL(file.signedUrl));
      signedUrls.forEach((url) =>
        expectSignedUrl({
          url,
          expectedSignedUrl: aFile.signedUrl!,
        }),
      );
    });

    it('deletes the file', async () => {
      await s3StorageProvider.deleteFile(bucket, filePath, aFile.name);
      await expect(
        minioS3StorageClient.send(
          new HeadObjectCommand({
            Bucket: bucket,
            Key,
          }),
        ),
      ).rejects.toBeDefined();
    });

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
});
