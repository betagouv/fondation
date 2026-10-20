// oxlint-disable typescript/unbound-method
import { mock, type MockProxy } from 'vitest-mock-extended';

import { FileDelegate } from '../../../generated/prisma/models';
import { Clock } from '../clock';
import { ApiConfig } from '../config';
import { Db } from '../database';

import { DeleteUnreferencedObjectsCommand } from './delete-unreferenced-objects.cli';
import { Files } from './files';

describe('DeleteUnreferencedObjectsCommand', () => {
  let tx: { file: MockProxy<FileDelegate> };
  let files: MockProxy<Files>;
  let command: DeleteUnreferencedObjectsCommand;

  const now = new Date('2026-10-20T08:00:00Z');
  const old = new Date('2025-06-01');

  beforeEach(() => {
    tx = { file: mock() };
    // comparing the delegate to a deep partial of the Prisma client exhausts the compiler
    const db = mock<Db>({ tx: tx as never });
    db.withTransaction.mockImplementation(((...args: unknown[]) => {
      const fn = args.find((a) => typeof a === 'function') as () => unknown;
      return fn();
    }) as never);
    const clock = mock<Clock>();
    clock.now.mockReturnValue(now);

    files = mock<Files>();
    command = new DeleteUnreferencedObjectsCommand(clock, db, files, {
      s3: { bucket: 'fondation' },
    } as ApiConfig);

    tx.file.findMany.mockResolvedValue([
      { path: ['sessions', 'courrier signé.pdf'] },
      { path: ['sessions', 'avis motivé.pdf'] },
    ] as never);
    files.storedObjects.mockImplementation(async function* () {
      yield { key: 'sessions/courrier%20sign%C3%A9.pdf', size: 100, writtenAt: old };
      yield { key: 'sessions/avis motivé.pdf', size: 100, writtenAt: old };
      yield { key: 'Ete 2025/rapport.pdf', size: 100, writtenAt: old };
      yield { key: 'sessions/en-cours.pdf', size: 100, writtenAt: new Date('2026-10-20T07:00:00Z') };
    });
  });

  it('only lists the objects no file refers to, one date and key per line', async () => {
    const write = vi.spyOn(process.stdout, 'write').mockReturnValue(true);

    await command.run([], {});

    expect(write.mock.calls.filter(([line]) => String(line).includes('\t'))).toEqual([
      ['2025-06-01T00:00:00.000Z\tEte 2025/rapport.pdf\n'],
    ]);
    expect(files.deleteStoredObjects).not.toHaveBeenCalled();
    write.mockRestore();
  });

  it('deletes them when asked to, leaving the referenced, the recent and the ones written before the paths were normalized', async () => {
    await command.run([], { delete: true });

    expect(files.deleteStoredObjects).toHaveBeenCalledExactlyOnceWith(['Ete 2025/rapport.pdf']);
  });

  it('refuses to run when the database knows no file', async () => {
    tx.file.findMany.mockResolvedValue([]);

    await expect(command.run([], { delete: true })).rejects.toThrow('No file in the database');
    expect(files.deleteStoredObjects).not.toHaveBeenCalled();
  });
});
