import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListBucketsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { minioS3StorageClient } from 'src/files-context/adapters/secondary/gateways/providers/minio-s3-sorage.client';

export const createBucket = async (
  bucket: string,
  s3Client: S3Client = minioS3StorageClient,
) => {
  await s3Client.send(
    new CreateBucketCommand({
      Bucket: bucket,
    }),
  );
};

export const givenSomeS3Files = async (
  s3Client: S3Client,
  ...files: {
    bucket: string;
    Key: string;
  }[]
) => {
  for (const file of files) {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: file.bucket,
        Key: file.Key,
        Body: Buffer.from('file content'),
      }),
    );
    await expect(
      s3Client.send(
        new HeadObjectCommand({
          Bucket: file.bucket,
          Key: file.Key,
        }),
      ),
    ).resolves.toBeDefined();
  }
};

export const deleteS3Files = async (s3Client: S3Client) => {
  const bucketsResponse = await s3Client.send(new ListBucketsCommand({}));
  const buckets = bucketsResponse.Buckets || [];

  for (const bucket of buckets) {
    if (!bucket.Name) continue;

    const listResponse = await s3Client.send(
      new ListObjectsV2Command({ Bucket: bucket.Name, Prefix: '' }),
    );

    const objectsToDelete =
      listResponse.Contents?.map((object) => ({
        Key: object.Key,
      })) || [];
    if (objectsToDelete.length > 0) {
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: bucket.Name,
          Delete: { Objects: objectsToDelete },
        }),
      );
    }
  }
};

const deleteS3Buckets = async (
  s3StorageClient: S3Client = minioS3StorageClient,
) => {
  try {
    const bucketsResponse = await s3StorageClient.send(
      new ListBucketsCommand({}),
    );
    const buckets = bucketsResponse.Buckets || [];

    for (const bucket of buckets) {
      if (!bucket.Name) continue;

      const listResponse = await s3StorageClient.send(
        new ListObjectsV2Command({ Bucket: bucket.Name, Prefix: '' }),
      );

      const objectsToDelete =
        listResponse.Contents?.map((object) => ({
          Key: object.Key,
        })) || [];

      if (objectsToDelete.length > 0) {
        await s3StorageClient.send(
          new DeleteObjectsCommand({
            Bucket: bucket.Name,
            Delete: { Objects: objectsToDelete },
          }),
        );
      }

      await s3StorageClient.send(
        new DeleteBucketCommand({
          Bucket: bucket.Name,
        }),
      );
    }
  } catch (error) {
    console.error('Error deleting objects:', error);
  }
};

export const endMinio = async () => {
  await deleteS3Buckets();
};
