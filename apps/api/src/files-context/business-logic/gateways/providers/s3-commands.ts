import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';

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
  putObject(
    bucketName: string,
    file: Buffer,
    fileName: string,
    mimeType: string,
  ) {
    return new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: file,
      ...this.sseHeaders,
      ContentDisposition: 'inline',
      ContentType: mimeType,
    });
  }
  getObject(bucketName: string, fileName: string) {
    return new GetObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      ...this.sseHeaders,
    });
  }
  deleteFile(bucketName: string, fileName: string) {
    return new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    });
  }
}
