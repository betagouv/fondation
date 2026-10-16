// oxlint-disable typescript/unbound-method
import { S3ServiceException } from '@aws-sdk/client-s3';
import { HttpService } from '@nestjs/axios';
import { mock, type MockProxy } from 'vitest-mock-extended';

import { FileDelegate } from 'src/generated/prisma/models';
import { Clock } from 'src/modules/framework/clock';
import { ApiConfig } from 'src/modules/framework/config';
import { Db } from 'src/modules/framework/database';

import { Files } from './files';

describe('Files', () => {
  let tx: { file: MockProxy<FileDelegate> };
  let send: ReturnType<typeof vi.fn>;
  let files: Files;

  const linkedCopy = { id: 'copy-id', path: ['observations', 'courrier.pdf'] };

  beforeEach(() => {
    tx = { file: mock() };
    // comparing the delegate to a deep partial of the Prisma client exhausts the compiler
    const db = mock<Db>({ tx: tx as never });
    db.isTransactionActive.mockReturnValue(false);
    db.withTransaction.mockImplementation(((...args: unknown[]) => {
      const fn = args.find((a) => typeof a === 'function') as () => unknown;
      return fn();
    }) as never);

    files = new Files(new Clock(), db, mock<HttpService>(), {
      originUrl: 'http://localhost:3000',
      s3: { bucket: 'fondation', region: 'fr-par', signedUrlDurationSeconds: 60 },
    } as ApiConfig);

    send = vi.fn().mockResolvedValue({ Deleted: [], Errors: [] });
    (files as any).client = { send };
  });

  describe('delete', () => {
    it('keeps the object in storage while another file row points to it', async () => {
      tx.file.findMany.mockResolvedValue([{ path: linkedCopy.path }] as never);

      await (files as any)._delete([linkedCopy]);

      expect(send).not.toHaveBeenCalled();
      expect(tx.file.delete).toHaveBeenCalledWith({ where: { id: linkedCopy.id } });
    });

    it('removes the object from storage once no other file row points to it', async () => {
      tx.file.findMany.mockResolvedValue([]);

      await (files as any)._delete([linkedCopy]);

      expect(send).toHaveBeenCalledOnce();
      expect(send.mock.calls[0]![0].input.Delete.Objects).toEqual([{ Key: 'observations/courrier.pdf' }]);
      expect(tx.file.delete).toHaveBeenCalledWith({ where: { id: linkedCopy.id } });
    });
  });

  describe('storedSize', () => {
    function headFailsWith(status: number) {
      send.mockRejectedValue(
        new S3ServiceException({ $fault: 'client', $metadata: { httpStatusCode: status }, name: 'Unknown' }),
      );
    }

    it('answers the size the storage knows', async () => {
      send.mockResolvedValue({ ContentLength: 1024 });

      await expect(files.storedSize(linkedCopy)).resolves.toEqual({ size: 1024, status: 'FOUND' });
      expect(send.mock.calls[0]![0].input.Key).toBe('observations/courrier.pdf');
    });

    it('tells a missing object', async () => {
      headFailsWith(404);

      await expect(files.storedSize(linkedCopy)).resolves.toEqual({ status: 'MISSING' });
    });

    it('tells a refusal apart from a missing object', async () => {
      headFailsWith(403);

      await expect(files.storedSize(linkedCopy)).resolves.toEqual({ status: 'REFUSED' });
    });

    it('lets any other storage failure through', async () => {
      headFailsWith(500);

      await expect(files.storedSize(linkedCopy)).rejects.toBeInstanceOf(S3ServiceException);
    });
  });
});
