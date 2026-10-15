import { NoSuchKey, S3ServiceException } from '@aws-sdk/client-s3';
import { isAxiosError } from 'axios';

// a 403 stays a failure: S3 also answers it for a missing key without ListBucket, or an expired signature
export function isMissingFromStorage(error: unknown): boolean {
  if (isAxiosError(error)) return error.response?.status === 404;

  return error instanceof NoSuchKey || (error instanceof S3ServiceException && error.name === 'NotFound');
}
