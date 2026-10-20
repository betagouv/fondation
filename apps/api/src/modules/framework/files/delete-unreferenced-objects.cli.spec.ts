// oxlint-disable typescript/unbound-method
import { mock, type MockProxy } from 'vitest-mock-extended';

import { FileDelegate } from 'src/generated/prisma/models';
import { Clock } from 'src/modules/framework/clock';
import { ApiConfig } from 'src/modules/framework/config';
import { Db } from 'src/modules/framework/database';

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
      yield { key: 'sessions/courrier%20sign%C3%A9.pdf', writtenAt: old };
      yield { key: 'sessions/avis motivé.pdf', writtenAt: old };
      yield { key: 'Ete 2025/rapport.pdf', writtenAt: old };
      yield { key: 'sessions/en-cours.pdf', writtenAt: new Date('2026-10-20T07:00:00Z') };
    });
  });

  it('only lists the objects no file refers to', async () => {
    await command.run([], {});

    expect(files.deleteStoredObjects).not.toHaveBeenCalled();
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
