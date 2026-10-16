// oxlint-disable typescript/unbound-method
import { mock, type MockProxy } from 'vitest-mock-extended';

import { FileDelegate } from 'src/generated/prisma/models';
import { ApiConfig } from 'src/modules/framework/config';
import { Db } from 'src/modules/framework/database';

import { Files } from './files';
import { BackfillFileSizesCommand } from './files-cli.module';

describe('BackfillFileSizesCommand', () => {
  let tx: { file: MockProxy<FileDelegate> };
  let files: MockProxy<Files>;
  let command: BackfillFileSizesCommand;

  const known = { path: ['sessions', 'recent.pdf'], sizeInBytes: 2048 };
  const attachment = { id: 'file-id', path: ['observations', 'courrier.pdf'] };

  beforeEach(() => {
    tx = { file: mock() };
    // comparing the delegate to a deep partial of the Prisma client exhausts the compiler
    const db = mock<Db>({ tx: tx as never });
    db.withTransaction.mockImplementation(((...args: unknown[]) => {
      const fn = args.find((a) => typeof a === 'function') as () => unknown;
      return fn();
    }) as never);

    files = mock<Files>();
    command = new BackfillFileSizesCommand(db, files, { s3: { bucket: 'fondation' } } as ApiConfig);

    tx.file.findMany.mockResolvedValueOnce([known] as never).mockResolvedValueOnce([attachment] as never);
  });

  it('copies the size the storage knows', async () => {
    files.storedSize.mockResolvedValueOnce({ size: 2048, status: 'FOUND' });
    files.storedSize.mockResolvedValueOnce({ size: 1024, status: 'FOUND' });

    await command.run([], {});

    expect(tx.file.update).toHaveBeenCalledExactlyOnceWith({
      data: { sizeInBytes: 1024 },
      where: { id: attachment.id },
    });
  });

  it('writes nothing on a dry run', async () => {
    files.storedSize.mockResolvedValueOnce({ size: 2048, status: 'FOUND' });
    files.storedSize.mockResolvedValueOnce({ size: 1024, status: 'FOUND' });

    await command.run([], { dryRun: true });

    expect(tx.file.update).not.toHaveBeenCalled();
  });

  it('skips an attachment missing from the storage', async () => {
    files.storedSize.mockResolvedValueOnce({ size: 2048, status: 'FOUND' });
    files.storedSize.mockResolvedValueOnce({ status: 'MISSING' });

    await command.run([], {});

    expect(tx.file.update).not.toHaveBeenCalled();
  });

  it('stops before writing when the storage disagrees with a known size', async () => {
    files.storedSize.mockResolvedValueOnce({ size: 2080, status: 'FOUND' });

    await expect(command.run([], {})).rejects.toThrow('the database knows 2048');
    expect(tx.file.update).not.toHaveBeenCalled();
  });

  it('stops before writing when the storage refuses a known file', async () => {
    files.storedSize.mockResolvedValueOnce({ status: 'REFUSED' });

    await expect(command.run([], {})).rejects.toThrow('The storage refuses sessions/recent.pdf');
    expect(tx.file.update).not.toHaveBeenCalled();
  });

  it('stops before writing when no known size could be checked', async () => {
    files.storedSize.mockResolvedValueOnce({ status: 'MISSING' });

    await expect(command.run([], {})).rejects.toThrow('No known size could be checked');
    expect(tx.file.update).not.toHaveBeenCalled();
  });
});
