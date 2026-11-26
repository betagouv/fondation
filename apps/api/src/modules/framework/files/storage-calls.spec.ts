// oxlint-disable typescript/unbound-method
import { Readable } from 'node:stream';

import { GetObjectCommand, HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { mock } from 'vitest-mock-extended';

import { WideEvent } from '../wide-event';

import { timeStorageCalls } from './storage-calls';

describe('timeStorageCalls', () => {
  const outcomes: Promise<string>[] = [];
  const wideEvent = mock<WideEvent>();
  let statusCode: number;
  let client: S3Client;

  beforeEach(() => {
    outcomes.length = 0;
    wideEvent.timeCall.mockReset().mockImplementation((_, call) => {
      const result = call();
      outcomes.push(
        result.then(
          () => 'succeeded',
          () => 'failed',
        ),
      );
      return result;
    });

    client = new S3Client({
      credentials: { accessKeyId: 'key', secretAccessKey: 'secret' },
      endpoint: 'http://s3.test',
      forcePathStyle: true,
      maxAttempts: 1,
      region: 'eu-west-2',
      requestHandler: {
        handle: async () => ({ response: { body: Readable.from([]), headers: {}, statusCode } }),
      },
    });
    timeStorageCalls(client, wideEvent);
  });

  it('should time a call to the storage', async () => {
    statusCode = 200;
    await client.send(new HeadBucketCommand({ Bucket: 'bucket' }));

    expect(wideEvent.timeCall).toHaveBeenCalledWith('storage', expect.any(Function));
    await expect(Promise.all(outcomes)).resolves.toEqual(['succeeded']);
  });

  it('should count as failed a call the storage refuses', async () => {
    statusCode = 404;
    await expect(client.send(new HeadBucketCommand({ Bucket: 'bucket' }))).rejects.toThrow();

    await expect(Promise.all(outcomes)).resolves.toEqual(['failed']);
  });

  it('should not count a signed URL, which the client builds without calling the storage', async () => {
    await getSignedUrl(client, new GetObjectCommand({ Bucket: 'bucket', Key: 'file.pdf' }));

    expect(wideEvent.timeCall).not.toHaveBeenCalled();
  });
});
