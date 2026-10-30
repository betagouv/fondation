// oxlint-disable typescript/unbound-method
import { mock, type MockProxy } from 'vitest-mock-extended';

import { FileDelegate } from '../../../generated/prisma/models';
import { Clock } from '../clock';
import { ApiConfig } from '../config';
import { Db } from '../database';

import { DeleteUnusedFilesCommand } from './delete-unused-files.cli';
import { Files } from './files';

describe('DeleteUnusedFilesCommand', () => {
  let tx: { file: MockProxy<FileDelegate> };
  let files: MockProxy<Files>;
  let command: DeleteUnusedFilesCommand;

  const unused = { createdAt: new Date('2026-03-02'), id: 'file-id', path: ['sessions', 'courrier.pdf'] };

  beforeEach(() => {
    tx = { file: mock() };
    // comparing the delegate to a deep partial of the Prisma client exhausts the compiler
    const db = mock<Db>({ tx: tx as never });
    db.withTransaction.mockImplementation(((...args: unknown[]) => {
      const fn = args.find((a) => typeof a === 'function') as () => unknown;
      return fn();
    }) as never);

    files = mock<Files>();
    command = new DeleteUnusedFilesCommand(new Clock(), db, files, {
      s3: { bucket: 'fondation' },
    } as ApiConfig);

    tx.file.findMany.mockResolvedValue([unused] as never);
  });

  it('only lists the files nothing refers to anymore', async () => {
    await command.run([], {});

    expect(files.deleteNow).not.toHaveBeenCalled();
  });

  it('deletes them when asked to', async () => {
    await command.run([], { delete: true });

    expect(files.deleteNow).toHaveBeenCalledExactlyOnceWith([unused]);
  });
});
