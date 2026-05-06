#!/usr/bin/env node
const { S3Client, CreateBucketCommand, PutBucketVersioningCommand } = require('@aws-sdk/client-s3');

main().catch(console.error);
async function main() {
  const s3 = new S3Client({
    region: 'eu-west-2',
    forcePathStyle: true,
    endpoint: 'http://localhost:9000',
    credentials: {
      accessKeyId: 'fondation',
      secretAccessKey: 'fondation-secret',
    },
  });

  const BUCKETS = ['sandbox-csm-fondation-reports-context', 'sandbox-csm-fondation-transparences-context'];

  for (const bucketName of BUCKETS) {
    try {
      await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
      await s3.send(
        new PutBucketVersioningCommand({
          Bucket: bucketName,
          VersioningConfiguration: {
            Status: 'Enabled',
          },
        }),
      );
    } catch {
      /* noop */
    }
  }
}
