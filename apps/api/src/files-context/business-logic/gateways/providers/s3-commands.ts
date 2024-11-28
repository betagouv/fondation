import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { join } from 'path';

// TODO: Make it abstract then fix the generateProvider function typing
export class S3Commands {
  private readonly sseHeaders: object | undefined;

  constructor(sseHeaders?: object) {
    this.sseHeaders = sseHeaders;
  }

  headBucket(bucketName: string) {
    return new HeadBucketCommand({ Bucket: bucketName });
  }
  createBucket(bucketName: string) {
    return new CreateBucketCommand({ Bucket: bucketName });
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
    return join(...(filePath || []), fileName);
  }
}
