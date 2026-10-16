import { NoSuchKey } from '@aws-sdk/client-s3';
import { NotFoundException } from '@nestjs/common';
import { isAxiosError } from 'axios';

/** the database still knows the file, unlike an unknown or expired public url */
export class FileMissingFromStorage extends NotFoundException {}

// a 403 stays a failure: S3 also answers it for a missing key without ListBucket, or an expired signature
export function isMissingFromStorage(error: unknown): boolean {
  if (isAxiosError(error)) return error.response?.status === 404;

  return error instanceof NoSuchKey;
}
