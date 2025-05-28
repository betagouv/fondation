import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  ListObjectVersionsCommand,
  PutBucketCorsCommand,
  PutBucketCorsCommandInput,
  PutObjectCommand,
  PutObjectRequest,
} from '@aws-sdk/client-s3';
import { join } from 'path';

export type SseHeaders = Required<
  Pick<
    PutObjectRequest,
    'SSECustomerAlgorithm' | 'SSECustomerKey' | 'SSECustomerKeyMD5'
  >
>;

// TODO: Make it abstract then fix the generateProvider function typing
export class S3Commands {
  private readonly sseHeaders: SseHeaders | undefined;

  constructor(sseHeaders?: SseHeaders) {
    this.sseHeaders = sseHeaders;
  }

  headBucket(bucketName: string) {
    return new HeadBucketCommand({ Bucket: bucketName });
  }

  putBucketCors(input: PutBucketCorsCommandInput) {
    return new PutBucketCorsCommand(input);
  }

  headObject(bucket: string, filePath: string[] | null, fileName: string) {
    return new HeadObjectCommand({
      Bucket: bucket,
      Key: this.genKey(filePath, fileName),
    });
  }

  putObject(
    bucketName: string,
    file: Buffer,
    fileName: string,
    mimeType: string,
    filePath: string[] | null,
  ) {
    return new PutObjectCommand({
      Bucket: bucketName,
      Key: this.genKey(filePath, fileName),
      Body: file,
      ContentDisposition: 'inline',
      ContentType: mimeType,
      ...this.sseHeaders,
    });
  }
  getObject(bucketName: string, filePath: string[] | null, fileName: string) {
    return new GetObjectCommand({
      Bucket: bucketName,
      Key: this.genKey(filePath, fileName),
      ...this.sseHeaders,
    });
  }
  deleteObject(
    bucketName: string,
    filePath: string[] | null,
    fileName: string,
    versionId?: string,
  ) {
    return new DeleteObjectCommand({
      Bucket: bucketName,
      Key: this.genKey(filePath, fileName),
      VersionId: versionId,
    });
  }

  deleteObjects(
    bucketName: string,
    objects: {
      filePath: string[] | null;
      fileName: string;
    }[],
  ) {
    return new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: {
        Objects: objects.map((obj) => ({
          Key: this.genKey(obj.filePath, obj.fileName),
        })),
        Quiet: true, // Don't return list of deleted objects
      },
    });
  }

  listObjectVersions(
    bucket: string,
    filePath: string[] | null,
    fileName: string,
  ) {
    return new ListObjectVersionsCommand({
      Bucket: bucket,
      Prefix: this.genKey(filePath, fileName),
    });
  }

  genKey(filePath: string[] | null, fileName: string) {
    const key = join(...(filePath || []), encodeURIComponent(fileName));
    return key;
  }
}
