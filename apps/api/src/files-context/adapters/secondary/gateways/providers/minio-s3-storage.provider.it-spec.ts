import {
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { FileDocumentBuilder } from 'src/files-context/business-logic/builders/file-document.builder';
import { FileDocument } from 'src/files-context/business-logic/models/file-document';
import { defaultApiConfig } from 'src/shared-kernel/adapters/primary/nestjs/env';
import { MinioS3Commands } from './minio-s3-commands';
import { minioS3StorageClient } from './minio-s3-sorage.client';
import { RealS3StorageProvider } from './real-s3-storage.provider';

describe('MinIO S3 Storage Provider', () => {
  let s3StorageProvider: RealS3StorageProvider;

  beforeEach(() => {
    s3StorageProvider = new RealS3StorageProvider(
      minioS3StorageClient,
      defaultApiConfig,
      new MinioS3Commands(),
    );
  });

  it('saves a file', async () => {
    const fileBuffer = Buffer.from('file content');
    const fileName = 'file-name.txt';
    const mimeType = 'text/plain';
    expect(
      s3StorageProvider.uploadFile(fileBuffer, fileName, mimeType),
    ).toResolve();
  });

  describe('when there is already one file', () => {
    beforeEach(async () => {
      await deleteAllS3Objects();
      await givenSomeS3Files({
        fileName: aFile.name,
        fileBuffer: Buffer.from('file content'),
      });
    });

    it('gets the signed URL', async () => {
      const filesVM = await s3StorageProvider.getSignedUrls([
        FileDocument.fromSnapshot(aFile),
      ]);

      expect(filesVM.map((fileVM) => fileVM.name)).toEqual([aFile.name]);
      const signedUrls = filesVM.map((file) => new URL(file.signedUrl));
      expectSignedUrls(...signedUrls);
    });

    it('deletes the file', async () => {
      await s3StorageProvider.deleteFile(aFile.name);
      await expect(
        minioS3StorageClient.send(
          new HeadObjectCommand({
            Bucket: defaultApiConfig.s3.bucketName,
            Key: aFile.name,
          }),
        ),
      ).rejects.toThrow();
    });

    const expectSignedUrls = (...signedUrls: URL[]) => {
      expect(signedUrls.map(({ pathname }) => pathname)).toEqual([
        `/${defaultApiConfig.s3.bucketName}/${aFile.name}`,
      ]);
      expect(
        signedUrls.map(({ searchParams }) =>
          searchParams.get('X-Amz-Algorithm'),
        ),
      ).toEqual(['AWS4-HMAC-SHA256']);
      expect(
        signedUrls.map(({ searchParams }) =>
          searchParams.get('X-Amz-Credential'),
        ),
      ).toEqual([expect.anything()]);
      expect(
        signedUrls.map(({ searchParams }) => searchParams.get('X-Amz-Expires')),
      ).toEqual(['3600']);
      expect(
        signedUrls.map(({ searchParams }) =>
          searchParams.get('X-Amz-Signature'),
        ),
      ).toEqual([expect.any(String)]);
    };
  });
});

export const givenSomeS3Files = async (
  ...files: { fileName: string; fileBuffer: Buffer }[]
) => {
  for (const file of files) {
    const fileBuffer = Buffer.from('file content');
    await minioS3StorageClient.send(
      new PutObjectCommand({
        Bucket: defaultApiConfig.s3.bucketName,
        Key: file.fileName,
        Body: fileBuffer,
      }),
    );
  }
};

export const deleteAllS3Objects = async () => {
  try {
    const listResponse = await minioS3StorageClient.send(
      new ListObjectsV2Command({ Bucket: defaultApiConfig.s3.bucketName }),
    );

    if (listResponse.Contents?.length) {
      const objectsToDelete = listResponse.Contents.map((object) => ({
        Key: object.Key,
      }));

      await minioS3StorageClient.send(
        new DeleteObjectsCommand({
          Bucket: defaultApiConfig.s3.bucketName,
          Delete: {
            Objects: objectsToDelete,
          },
        }),
      );
    }
  } catch (error) {
    console.error('Error deleting objects:', error);
  }
};

const aFile = new FileDocumentBuilder()
  .with('id', 'file-id')
  .with('name', 'file-name.txt')
  .build();
