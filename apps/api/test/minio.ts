import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListBucketsCommand,
  ListObjectsV2Command,
  ListObjectVersionsCommand,
  PutBucketVersioningCommand,
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

  await s3Client.send(
    new PutBucketVersioningCommand({
      Bucket: bucket,
      VersioningConfiguration: {
        Status: 'Enabled',
      },
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

export const deleteS3Files = async (
  s3Client: S3Client,
  options?: { bucket?: string },
) => {
  const bucketsResponse = await s3Client.send(new ListBucketsCommand({}));
  const buckets = options?.bucket
    ? [{ Name: options.bucket }]
    : bucketsResponse.Buckets || [];

  for (const bucket of buckets) {
    if (!bucket.Name) continue;

    try {
      // First check if bucket has versioning enabled
      const versionsResponse = await s3Client.send(
        new ListObjectVersionsCommand({ Bucket: bucket.Name }),
      );

      const hasVersions = !!(
        versionsResponse.Versions && versionsResponse.Versions.length > 0
      );

      if (hasVersions) {
        const objectsToDelete = [];

        if (versionsResponse.Versions) {
          for (const version of versionsResponse.Versions) {
            if (version.Key && version.VersionId) {
              objectsToDelete.push({
                Key: version.Key,
                VersionId: version.VersionId,
              });
            }
          }
        }

        // Add all delete markers to the delete list
        if (versionsResponse.DeleteMarkers) {
          for (const marker of versionsResponse.DeleteMarkers) {
            if (marker.Key && marker.VersionId) {
              objectsToDelete.push({
                Key: marker.Key,
                VersionId: marker.VersionId,
              });
            }
          }
        }

        // Delete all versions and markers in batches if needed
        if (objectsToDelete.length > 0) {
          // S3 has a limit on how many objects can be deleted in one request
          const batchSize = 1000;
          for (let i = 0; i < objectsToDelete.length; i += batchSize) {
            const batch = objectsToDelete.slice(i, i + batchSize);
            await s3Client.send(
              new DeleteObjectsCommand({
                Bucket: bucket.Name,
                Delete: { Objects: batch },
              }),
            );
          }
        }
      } else {
        // Handle non-versioned bucket with regular object deletion
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
    } catch (error) {
      console.error(
        `Error deleting objects from bucket ${bucket.Name}:`,
        error,
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
