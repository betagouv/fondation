import type { S3Client } from '@aws-sdk/client-s3';

import type { WideEvent } from '../wide-event';

/**
 * Times each HTTP call of the client in the event of the request or the command: a retry is another call. In the step
 * that sends the request, which a signed URL never reaches, and ahead of the deserializer, which throws on an error
 * status
 */
export function timeStorageCalls(client: S3Client, wideEvent: WideEvent): void {
  client.middlewareStack.add((next) => (args) => wideEvent.timeCall('storage', () => next(args)), {
    name: 'timeStorageCalls',
    priority: 'high',
    step: 'deserialize',
  });
}
