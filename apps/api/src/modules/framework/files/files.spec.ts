// oxlint-disable typescript/unbound-method
import { NoSuchKey, S3ServiceException } from '@aws-sdk/client-s3';
import { HttpService } from '@nestjs/axios';
import { NotFoundException } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { AxiosError, AxiosHeaders } from 'axios';
import { throwError } from 'rxjs';
import { mock, type MockProxy } from 'vitest-mock-extended';

import { FileDelegate, FilePublicUrlDelegate } from 'src/generated/prisma/models';
import { Clock } from 'src/modules/framework/clock';
import { ApiConfig } from 'src/modules/framework/config';
import { Db } from 'src/modules/framework/database';

import { Files } from './files';
import { FileMissingFromStorage } from './missing-from-storage';

vi.mock('@sentry/node', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sentry/node')>()),
  captureMessage: vi.fn(),
}));

describe('Files', () => {
  let tx: { file: MockProxy<FileDelegate>; filePublicUrl: MockProxy<FilePublicUrlDelegate> };
  let http: MockProxy<HttpService>;
  let send: ReturnType<typeof vi.fn>;
  let files: Files;

  const linkedCopy = { id: 'copy-id', path: ['observations', 'courrier.pdf'] };

  beforeEach(() => {
    vi.mocked(Sentry.captureMessage).mockClear();

    tx = { file: mock(), filePublicUrl: mock() };
    // comparing the delegate to a deep partial of the Prisma client exhausts the compiler
    const db = mock<Db>({ tx: tx as never });
    db.isTransactionActive.mockReturnValue(false);
    db.withTransaction.mockImplementation(((...args: unknown[]) => {
      const fn = args.find((a) => typeof a === 'function') as () => unknown;
      return fn();
    }) as never);

    http = mock<HttpService>();
    files = new Files(new Clock(), db, http, {
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

  describe('getFileContent', () => {
    const storedFile = { id: 'file-id', name: 'courrier.pdf', path: ['observations', 'courrier.pdf'] };

    function storageAnswers(status: number) {
      const error = new AxiosError('storage error', undefined, undefined, undefined, {
        config: { headers: new AxiosHeaders() },
        data: null,
        headers: {},
        status,
        statusText: '',
      });
      http.get.mockReturnValue(throwError(() => error));
    }

    beforeEach(() => {
      tx.filePublicUrl.findUnique.mockResolvedValue({
        expiresAt: new Date(Date.now() + 60_000),
        file: storedFile,
        url: 'https://s3.example/observations/courrier.pdf',
      } as never);
    });

    it('answers not found and warns Sentry when the storage lost a file the database knows', async () => {
      storageAnswers(404);

      await expect(files.getFileContent('public-url-id')).rejects.toThrow(FileMissingFromStorage);
      expect(Sentry.captureMessage).toHaveBeenCalledWith(expect.any(String), {
        extra: { fileId: 'file-id', path: 'observations/courrier.pdf' },
        level: 'warning',
      });
    });

    it('keeps a storage refusal as a server error', async () => {
      storageAnswers(403);

      await expect(files.getFileContent('public-url-id')).rejects.toBeInstanceOf(AxiosError);
      expect(Sentry.captureMessage).not.toHaveBeenCalled();
    });

    it('keeps an unknown or expired public url apart from a file the storage lost', async () => {
      tx.filePublicUrl.findUnique.mockResolvedValue(null);

      const content = files.getFileContent('public-url-id');

      await expect(content).rejects.toThrow(NotFoundException);
      await expect(content).rejects.not.toBeInstanceOf(FileMissingFromStorage);
    });
  });

  describe('getFile', () => {
    beforeEach(() => {
      tx.file.findUnique.mockResolvedValue({ path: ['agendas', 'ordre-du-jour.pdf'] } as never);
    });

    it('answers no file and warns Sentry when the storage lost a file the database knows', async () => {
      send.mockRejectedValue(new NoSuchKey({ $metadata: {}, message: 'The specified key does not exist.' }));

      await expect(files.getFile({ fileId: 'file-id' })).resolves.toBeNull();
      expect(Sentry.captureMessage).toHaveBeenCalledWith(expect.any(String), {
        extra: { fileId: 'file-id', path: 'agendas/ordre-du-jour.pdf' },
        level: 'warning',
      });
    });

    it('lets any other storage failure through', async () => {
      const failure = new S3ServiceException({
        $fault: 'client',
        $metadata: {},
        message: 'Access Denied',
        name: 'AccessDenied',
      });
      send.mockRejectedValue(failure);

      await expect(files.getFile({ fileId: 'file-id' })).rejects.toBe(failure);
      expect(Sentry.captureMessage).not.toHaveBeenCalled();
    });
  });
});
