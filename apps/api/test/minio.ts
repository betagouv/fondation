import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListBucketsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { minioS3StorageClient } from '../src/files-context/adapters/secondary/gateways/providers/minio-s3-sorage.client';

export const createMinioBucket = async (bucket: string) => {
  await minioS3StorageClient.send(
    new CreateBucketCommand({
      Bucket: bucket,
    }),
  );
};

export const givenSomeS3Files = async (
  ...files: {
    bucket: string;
    Key: string;
  }[]
) => {
  for (const file of files) {
    await minioS3StorageClient.send(
      new PutObjectCommand({
        Bucket: file.bucket,
        Key: file.Key,
        Body: Buffer.from('file content'),
      }),
    );
    await expect(
      minioS3StorageClient.send(
        new HeadObjectCommand({
          Bucket: file.bucket,
          Key: file.Key,
        }),
      ),
    ).resolves.toBeDefined();
  }
};

export const deleteMinioBuckets = async () => {
  try {
    const bucketsResponse = await minioS3StorageClient.send(
      new ListBucketsCommand({}),
    );
    const buckets = bucketsResponse.Buckets || [];

    for (const bucket of buckets) {
      if (!bucket.Name) continue;

      const listResponse = await minioS3StorageClient.send(
        new ListObjectsV2Command({ Bucket: bucket.Name, Prefix: '' }),
      );

      const objectsToDelete =
        listResponse.Contents?.map((object) => ({
          Key: object.Key,
        })) || [];

      if (objectsToDelete.length > 0) {
        await minioS3StorageClient.send(
          new DeleteObjectsCommand({
            Bucket: bucket.Name,
            Delete: { Objects: objectsToDelete },
          }),
        );
      }

      await minioS3StorageClient.send(
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
  await deleteMinioBuckets();
};
