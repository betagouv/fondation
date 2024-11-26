import {
  DeleteBucketCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { minioS3StorageClient } from '../src/files-context/adapters/secondary/gateways/providers/minio-s3-sorage.client';
import { defaultApiConfig } from '../src/shared-kernel/adapters/primary/nestjs/env';
import { db, dockerDBInstance } from './docker-postgresql-manager';

const teardown = async (): Promise<void> => {
  if (db) {
    await endDbConnection();
  }
  await endMinio();
  await endDockerCompose();
};

const endDbConnection = async () => {
  try {
    if (!db.$client.ended) await db.$client.end();
  } catch (e) {
    console.log('Failing to close db connection', e);
  }
  console.log('Closed db connection');
};

export const endDockerCompose = async () => {
  console.log('Shutting dow docker compose containers');
  try {
    await dockerDBInstance?.down({ removeVolumes: true });
    console.log('Removed docker containers');
  } catch (e) {
    console.log('Failing to shutdown the docker containers', e);
  }
};

export const endMinio = async () => {
  await deleteAllS3Objects();
  await minioS3StorageClient.send(
    new DeleteBucketCommand({
      Bucket: defaultApiConfig.s3.bucketName,
    }),
  );
  console.log('Removed Minio bucket');
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

export default teardown;
