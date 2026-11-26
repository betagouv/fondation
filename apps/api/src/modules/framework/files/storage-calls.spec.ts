// oxlint-disable typescript/unbound-method
import { Readable } from 'node:stream';

import { GetObjectCommand, HeadBucketCommand, NoSuchKey, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AxiosError, AxiosHeaders } from 'axios';
import { mock } from 'vitest-mock-extended';

import { WideEvent } from '../wide-event';

import { isStorageFailure, timeStorageCalls } from './storage-calls';

describe('timeStorageCalls', () => {
  const outcomes: Promise<string>[] = [];
  const wideEvent = mock<WideEvent>();
  let response: { body?: string; statusCode: number };
  let client: S3Client;

  beforeEach(() => {
    outcomes.length = 0;
    wideEvent.timeCall.mockReset().mockImplementation((_, call, isFailure) => {
      const result = call();
      outcomes.push(
        result.then(
          () => 'succeeded',
          (error: unknown) => (isFailure?.(error) ? 'failed' : 'answered'),
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
        handle: async () => ({
          response: {
            body: Readable.from(response.body ? [response.body] : []),
            headers: {},
            statusCode: response.statusCode,
          },
        }),
      },
    });
    timeStorageCalls(client, wideEvent);
  });

  it('should time a call to the storage', async () => {
    response = { statusCode: 200 };
    await client.send(new HeadBucketCommand({ Bucket: 'bucket' }));

    expect(wideEvent.timeCall).toHaveBeenCalledWith('storage', expect.any(Function), isStorageFailure);
    await expect(Promise.all(outcomes)).resolves.toEqual(['succeeded']);
  });

  it('should count as failed a call the storage refuses', async () => {
    response = { statusCode: 403 };
    await expect(client.send(new HeadBucketCommand({ Bucket: 'bucket' }))).rejects.toThrow();

    await expect(Promise.all(outcomes)).resolves.toEqual(['failed']);
  });

  it('should not count as failed a file the storage no longer has', async () => {
    response = { body: '<Error><Code>NoSuchKey</Code></Error>', statusCode: 404 };
    await expect(client.send(new GetObjectCommand({ Bucket: 'bucket', Key: 'file.pdf' }))).rejects.toThrow(
      NoSuchKey,
    );

    await expect(Promise.all(outcomes)).resolves.toEqual(['answered']);
  });

  it('should not count a signed URL, which the client builds without calling the storage', async () => {
    await getSignedUrl(client, new GetObjectCommand({ Bucket: 'bucket', Key: 'file.pdf' }));

    expect(wideEvent.timeCall).not.toHaveBeenCalled();
  });
});

describe('isStorageFailure', () => {
  function answered(status: number): AxiosError {
    const headers = new AxiosHeaders();
    return new AxiosError('answered', undefined, { headers }, undefined, {
      config: { headers },
      data: undefined,
      headers: {},
      status,
      statusText: '',
    });
  }

  it.each([
    [404, false],
    [416, false],
    [403, true],
    [503, true],
  ])('should tell a read of a signed URL answered %i as failed: %s', (status, failed) => {
    expect(isStorageFailure(answered(status))).toBe(failed);
  });

  it('should count as failed a storage that cannot be reached', () => {
    expect(isStorageFailure(new AxiosError('connect ECONNREFUSED', 'ECONNREFUSED'))).toBe(true);
  });
});
