import type { S3Client } from '@aws-sdk/client-s3';
import { HttpStatus } from '@nestjs/common';
import { isAxiosError } from 'axios';

import type { WideEvent } from '../wide-event';

import { isMissingFromStorage } from './missing-from-storage';

/**
 * Not when the storage answers rightly: a file it no longer has, which reportMissingFromStorage reports apart, or a range
 * past the end of the file, which the browser asked for. A 403 stays one (see isMissingFromStorage)
 */
export function isStorageFailure(error: unknown): boolean {
  if (isMissingFromStorage(error)) return false;

  return !isAxiosError(error) || error.response?.status !== HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE;
}

/**
 * Times each HTTP call of the client in the event of the request or the command: a retry is another call. In the step
 * that sends the request, which a signed URL never reaches, and ahead of the deserializer, which throws on an error
 * status
 */
export function timeStorageCalls(client: S3Client, wideEvent: WideEvent): void {
  client.middlewareStack.add(
    (next) => (args) => wideEvent.timeCall('storage', () => next(args), isStorageFailure),
    { name: 'timeStorageCalls', priority: 'high', step: 'deserialize' },
  );
}
