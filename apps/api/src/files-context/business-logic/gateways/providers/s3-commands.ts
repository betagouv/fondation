import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
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
  deleteFile(bucketName: string, filePath: string[] | null, fileName: string) {
    return new DeleteObjectCommand({
      Bucket: bucketName,
      Key: this.genKey(filePath, fileName),
    });
  }

  private genKey(filePath: string[] | null, fileName: string) {
    const key = join(...(filePath || []), encodeURIComponent(fileName));
    return key;
  }
}
