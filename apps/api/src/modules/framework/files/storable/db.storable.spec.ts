// oxlint-disable typescript/unbound-method
import { Logger, NotFoundException, StreamableFile } from '@nestjs/common';
import { mock, type MockProxy } from 'vitest-mock-extended';

import { FileDelegate, FilePublicUrlDelegate } from 'src/generated/prisma/models';
import { Clock } from 'src/modules/framework/clock';
import { ApiConfig } from 'src/modules/framework/config';
import { Db } from 'src/modules/framework/database';
import { MONTHS } from 'src/utils/time';

import { DbStorage } from './db.storable';
import { StorageResult } from './result.storable';
import { makeStorablePath, Storable, type Storage, type Stored } from './storable.types';

describe('DbStorage', () => {
  let tx: { file: MockProxy<FileDelegate>; filePublicUrl: MockProxy<FilePublicUrlDelegate> };
  let db: MockProxy<Db>;
  let s3: MockProxy<Storage>;
  let storage: DbStorage;

  const object: Storable = {
    id: 'file-id',
    name: 'doc.pdf',
    mime: 'application/pdf',
    path: makeStorablePath(['sessions', 'doc.pdf']),
    content: Buffer.from('hello'),
  };

  function storageResult(options: {
    success: boolean;
    successes?: Stored[];
  }): MockProxy<StorageResult<Stored>> {
    return mock<StorageResult<Stored>>(options);
  }

  beforeEach(async () => {
    tx = { file: mock(), filePublicUrl: mock() };
    db = mock<Db>({ tx });
    db.withTransaction.mockImplementation(((...args: unknown[]) => {
      const fn = args.find((a) => typeof a === 'function') as () => unknown;
      return fn();
    }) as never);

    s3 = mock<Storage>();

    storage = new DbStorage(new Clock(), s3, db, {
      originUrl: 'http://localhost:3000',
    } as ApiConfig);

    (storage as any).logger = { error: () => {} } as unknown as Logger;
  });

  describe('put', () => {
    it('persists the files and returns a success', async () => {
      s3.put.mockResolvedValue(
        storageResult({ success: true, successes: [{ ...object, bucket: 'reports', byteSize: 128 }] }),
      );
      tx.file.createMany.mockResolvedValue({ count: 1 });

      const result = await storage.put([object]);

      expect(result.success).toBe(true);
      expect(result.successes).toContainEqual(expect.objectContaining({ id: object.id }));
      expect(tx.file.createMany).toHaveBeenCalledOnce();
    });

    it('rolls back the storage and does not persist when the upload fails', async () => {
      const failure = storageResult({ success: false });
      failure.rollback.mockResolvedValue();

      s3.put.mockResolvedValue(failure);

      const result = await storage.put([object]);

      expect(result).toBe(failure);
      expect(failure.rollback).toHaveBeenCalled();
      expect(db.withTransaction).not.toHaveBeenCalled();
    });

    it('rolls back the uploaded objects when persisting the files fails', async () => {
      const uploaded = storageResult({
        success: true,
        successes: [{ ...object, bucket: 'reports', byteSize: 128 }],
      });
      uploaded.rollback.mockResolvedValue();

      s3.put.mockResolvedValue(uploaded);
      tx.file.createMany.mockRejectedValue(new Error('db down'));

      const result = await storage.put([object]);

      expect(uploaded.rollback).toHaveBeenCalled();
      expect(result.success).toBe(false);
    });

    it('returns a rollback-able result on success, that will delete files in db', async () => {
      s3.put.mockResolvedValue(
        storageResult({ success: true, successes: [{ ...object, bucket: 'reports', byteSize: 128 }] }),
      );
      tx.file.deleteMany.mockResolvedValue({ count: 1 });

      const result = await storage.put([object]);

      await result.rollback();
      expect(tx.file.deleteMany).toHaveBeenCalledWith({ where: { id: { in: [object.id] } } });
    });
  });

  describe('delete', () => {
    it('removes the files from storage once the db deletion succeeds', async () => {
      tx.file.delete.mockResolvedValue({ path: ['sessions', 'doc.pdf'] } as never);
      s3.delete.mockResolvedValue(mock<StorageResult<{ id: string }>>({ success: true }));

      const result = await storage.delete([{ id: object.id }]);

      expect(result.success).toBe(true);
      expect(s3.delete).toHaveBeenCalledWith([{ id: object.id, path: ['sessions', 'doc.pdf'] }]);
    });

    it('ignores the storage failure', async () => {
      s3.delete.mockRejectedValue(new Error('storage unavailable'));
      tx.file.delete.mockResolvedValue({
        path: ['sessions', 'attachments', `${crypto.randomUUID()}.pdf`],
      } as any);

      const result = await storage.delete([{ id: object.id }]);

      expect(result.success).toBe(true);
      expect(s3.delete).toHaveBeenCalled();
    });
  });

  describe('toStreamableFile', () => {
    it('delegates url objects to the underlying storage', async () => {
      const expected = { file: new StreamableFile(Buffer.from('x')), expiresAt: new Date() };
      s3.toStreamableFile.mockResolvedValue(expected);
      const url = new URL('https://s3.example/object');

      const result = await storage.toStreamableFile({ url });

      expect(s3.toStreamableFile).toHaveBeenCalledWith({ url });
      expect(result).toBe(expected);
    });

    it('throws NotFoundException for an unknown public url id', async () => {
      tx.filePublicUrl.findUnique.mockResolvedValue(null);

      await expect(storage.toStreamableFile({ publicUrlId: 'missing' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('publish', () => {
    it('returns a non expired public URL', async () => {
      const existingPublicUrlId = crypto.randomUUID();
      const inOneMonth = new Date(Date.now() + 1 * MONTHS);

      s3.publish.mockResolvedValue([]);
      tx.file.findMany.mockResolvedValue([
        {
          id: 'file-123',
          path: ['sessions', 'attachments', crypto.randomUUID() + '.pdf'],
          filePublicUrls: [{ id: existingPublicUrlId, expiresAt: inOneMonth }],
        },
      ] as any);

      const [result] = await storage.publish([{ id: 'file-123' }]);

      expect(result).toEqual({
        id: 'file-123',
        expiresAt: inOneMonth,
        url: new URL(`http://localhost:3000/api/files/v1/${existingPublicUrlId}`),
      });
    });

    it('forwards the publication to the underlying storage, and creates a public URL', async () => {
      const inOneMonth = new Date(Date.now() + 1 * MONTHS);
      const fileId = crypto.randomUUID();

      const path = makeStorablePath(['sessions', 'attachments', `${fileId}.pdf`]);

      s3.publish.mockResolvedValue([
        {
          path,
          id: 'file-123',
          url: new URL('http://s3.example.com/getFile'),
          expiresAt: inOneMonth,
        },
      ]);

      tx.filePublicUrl.createMany.mockResolvedValue({ count: 1 });
      tx.file.findMany.mockResolvedValue([
        {
          path,
          id: 'file-123',
          filePublicUrls: [],
        },
      ] as any);

      const [result] = await storage.publish([{ id: 'file-123' }]);

      expect(s3.publish).toHaveBeenCalled();
      expect(tx.filePublicUrl.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ url: 'http://s3.example.com/getFile' })],
      });

      expect(result).toMatchObject({
        id: 'file-123',
        expiresAt: expect.any(Date),
        url: expect.any(URL),
      });
      expect(result?.url.toString()).toMatch(new RegExp('http://localhost:3000/api/files/v1/.+'));
    });
  });
});
