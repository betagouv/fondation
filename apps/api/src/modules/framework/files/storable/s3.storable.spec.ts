// oxlint-disable typescript/unbound-method
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { InternalServerErrorException, Logger } from '@nestjs/common';
import { mock, type MockProxy } from 'vitest-mock-extended';

import { noop } from '../../../../utils/noop';
import { SECONDS } from '../../../../utils/time';
import type { Clock } from '../../clock';
import type { ApiConfig } from '../../config';

import { S3Client } from './s3';
import { S3Storage } from './s3.storable';
import { makeStorablePath, Storable } from './storable.types';

vi.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: vi.fn() }));
vi.mock('@aws-sdk/lib-storage', () => ({ Upload: vi.fn() }));

describe('S3Storage', () => {
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

    storage = new S3Storage(s3, clock, { s3: config } as ApiConfig);
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

    it('percent-encodes the file name sent as object metadata', async () => {
      vi.mocked(Upload).mockReturnValue({ done: () => Promise.resolve({ Bucket: 'reports' }) } as never);

      await storage.put([{ ...object, name: 'Décision cœur.pdf' }]);

      expect(Upload).toHaveBeenCalledWith(
        expect.objectContaining({
          params: expect.objectContaining({
            Metadata: { id: object.id, name: 'D%C3%A9cision%20c%C5%93ur.pdf' },
          }),
        }),
      );
    });

    it('reports and logs a failure when the upload throws', async () => {
      const error = new Error('s3 down');
      const logger = { error: vi.fn(), warn: noop } as unknown as Logger;
      (storage as any).logger = logger;
      vi.spyOn(s3, 'buildCommand').mockReturnValue({
        done: () => Promise.reject(error),
      } as never);

      const result = await storage.put([object]);

      expect(result.success).toBe(false);
      expect(result.failures).toContainEqual({
        ...object,
        bucket: '',
        byteSize: 0,
      });
      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining(object.id), error);
    });

    it('does not call s3 when rolling back without any uploaded object', async () => {
      vi.spyOn(s3, 'buildCommand').mockReturnValue({
        done: () => Promise.reject(new Error('s3 down')),
      } as never);

      const result = await storage.put([object]);
      await result.rollback();

      expect(s3.send).not.toHaveBeenCalled();
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
});
