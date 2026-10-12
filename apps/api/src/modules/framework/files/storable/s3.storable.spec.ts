// oxlint-disable typescript/unbound-method
import { Readable } from 'node:stream';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { HttpService } from '@nestjs/axios';
import {
  InternalServerErrorException,
  Logger,
  NotImplementedException,
  StreamableFile,
} from '@nestjs/common';
import { of } from 'rxjs';
import { mock, type MockProxy } from 'vitest-mock-extended';

import type { Clock } from 'src/modules/framework/clock';
import type { ApiConfig } from 'src/modules/framework/config';
import { noop } from 'src/utils/noop';
import { SECONDS } from 'src/utils/time';

import { S3Client } from './s3';
import { S3Storage } from './s3.storable';
import { makeStorablePath, Storable } from './storable.types';

vi.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: vi.fn() }));

describe('S3Storage', () => {
  let http: MockProxy<HttpService>;
  let s3: S3Client;
  let clock: MockProxy<Clock>;
  let storage: S3Storage;

  const now = new Date('2026-08-03T00:00:00.000Z');

  const fileDuration = 10 * SECONDS;
  const expiresAt = new Date(now.getTime() + fileDuration);

  const object: Storable = {
    id: 'file-id',
    name: 'doc.pdf',
    mime: 'application/pdf',
    path: makeStorablePath(['sessions', 'doc.pdf']),
    content: Buffer.from('hello'),
  };

  beforeEach(() => {
    const config = {
      bucket: 'fondation',
      region: 'eu-west-2',
      forcePathStyle: false,
      encryptionKeyBase64: undefined,
      endpoint: 'http://s3.example.com',
      credentials: { accessKeyId: 'ak', secretAccessKey: 'sk' },
      signedUrlDurationSeconds: fileDuration / SECONDS,
    } satisfies ApiConfig['s3'];

    s3 = new S3Client({ s3: config } as ApiConfig);
    vi.spyOn(s3, 'send').mockResolvedValue();

    clock = mock<Clock>();
    clock.now.mockReturnValue(now);

    http = mock<HttpService>();

    storage = new S3Storage(http, s3, clock, { s3: config } as ApiConfig);
    (storage as any).logger = { warn: noop, error: noop } as unknown as Logger;
  });

  describe('put', () => {
    it('uploads each object and reports success', async () => {
      vi.spyOn(s3, 'buildCommand').mockReturnValue({
        done: () => Promise.resolve({ Bucket: 'reports' }),
      } as never);

      const result = await storage.put([object]);

      expect(result.success).toBe(true);
      expect(result.successes).toContainEqual({
        ...object,
        bucket: 'reports',
        byteSize: (object.content as Buffer).byteLength,
      });
    });

    it('reports a failure when the upload throws', async () => {
      vi.spyOn(s3, 'buildCommand').mockReturnValue({
        done: () => Promise.reject(new Error('s3 down')),
      } as never);

      const result = await storage.put([object]);

      expect(result.success).toBe(false);
      expect(result.failures).toContainEqual({
        ...object,
        bucket: '',
        byteSize: 0,
      });
    });
  });

  describe('publish', () => {
    it('throws when an object is missing a path', async () => {
      await expect(storage.publish([{ id: object.id }])).rejects.toThrow(InternalServerErrorException);
    });

    it('returns a signed url with an expiry computed from the clock', async () => {
      vi.mocked(getSignedUrl).mockResolvedValue('https://s3.example/signed');

      const [published] = await storage.publish([{ id: object.id, path: object.path }]);

      expect(published?.url).toEqual(new URL('https://s3.example/signed'));
      expect(published?.expiresAt).toEqual(expiresAt);
    });
  });

  describe('delete', () => {
    it('fails when an object has no path', async () => {
      const result = await storage.delete([{ id: object.id }]);

      expect(result.success).toBe(false);
      expect(s3.send).not.toHaveBeenCalled();
    });

    it('fails when the s3 deletion errors', async () => {
      vi.spyOn(s3, 'send').mockRejectedValue(new Error('s3 down'));

      const result = await storage.delete([{ id: object.id, path: object.path }]);

      expect(result.success).toBe(false);
    });

    it('marks the object as deleted using its version marker', async () => {
      vi.spyOn(s3, 'send').mockResolvedValue({
        Errors: [],
        Deleted: [{ DeleteMarker: true, DeleteMarkerVersionId: 'v1', Key: 'sessions/doc.pdf' }],
      } as never);

      const result = await storage.delete([{ id: object.id, path: object.path }]);

      expect(result.success).toBe(true);
      expect(result.successes).toContainEqual({
        id: object.id,
        path: object.path,
        versionId: 'v1',
      });
    });
  });

  describe('toStreamableFile', () => {
    it('throws NotImplemented when called with a public url id', async () => {
      await expect(storage.toStreamableFile({ publicUrlId: 'x' })).rejects.toThrow(NotImplementedException);
    });

    it('throws when an id object has no path', async () => {
      await expect(storage.toStreamableFile({ id: object.id })).rejects.toThrow(InternalServerErrorException);
    });

    it('streams an object fetched from s3 by its path', async () => {
      vi.spyOn(s3, 'send').mockResolvedValue({ Body: Readable.from(['data']) } as never);

      const { file, expiresAt: streamedExpiry } = await storage.toStreamableFile({
        id: object.id,
        path: object.path,
        name: object.name,
      });

      expect(file).toBeInstanceOf(StreamableFile);
      expect(streamedExpiry).toEqual(expiresAt);
    });

    it('throws when s3 returns no body', async () => {
      vi.spyOn(s3, 'send').mockResolvedValue({} as never);

      await expect(storage.toStreamableFile({ id: object.id, path: object.path })).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('streams a url through the http client', async () => {
      http.get.mockReturnValue(of({ data: Readable.from(['data']) }) as never);

      const { file } = await storage.toStreamableFile({ url: new URL('https://s3.example/object') });

      expect(file).toBeInstanceOf(StreamableFile);
      expect(http.get).toHaveBeenCalledOnce();
    });
  });
});
