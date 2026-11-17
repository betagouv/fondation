// oxlint-disable typescript/unbound-method
import { mock, type MockProxy } from 'vitest-mock-extended';

import type { PositionVacancyDelegate } from '../../../../generated/prisma/models';
import { Clock } from '../../../framework/clock';
import { transactionalTest } from '../../../framework/database/transactional-test';
import type { Files } from '../../../framework/files';
import type { HeldPositionFinder } from '../finders/held-position.finder';

import { PositionVacancyRepository } from './position-vacancy.repository';

describe('PositionVacancyRepository', () => {
  let deleteLapsed: () => Promise<number>;
  let files: MockProxy<Files>;
  let prisma: {
    $transaction: (fn: (client: object) => Promise<unknown>) => Promise<unknown>;
    positionVacancy: MockProxy<PositionVacancyDelegate>;
  };

  beforeEach(async () => {
    files = mock<Files>();
    prisma = { $transaction: (fn) => fn(prisma), positionVacancy: mock() };
    const { db, inTransaction } = await transactionalTest(prisma);
    const repository = new PositionVacancyRepository(new Clock(), db, files, mock<HeldPositionFinder>());

    deleteLapsed = () => inTransaction(() => repository.deleteLapsed());
  });

  it('deletes nothing while every magistrat holds their position', async () => {
    prisma.positionVacancy.findMany.mockResolvedValue([
      {
        attachments: [],
        magistrat: { currentPositionId: '7', status: 'ACTIVE' },
        magistratId: 'kept',
        positionId: 7,
      },
    ] as never);

    await expect(deleteLapsed()).resolves.toBe(0);

    expect(prisma.positionVacancy.deleteMany).not.toHaveBeenCalled();
    expect(files.delete).not.toHaveBeenCalled();
  });

  it('deletes the vacancies of the magistrats LOLFI moved, with their attachments', async () => {
    const decision = { id: 'decision', path: ['veille-des-postes', 'decision.pdf'] };
    prisma.positionVacancy.findMany.mockResolvedValue([
      {
        attachments: [],
        magistrat: { currentPositionId: '7', status: 'ACTIVE' },
        magistratId: 'kept',
        positionId: 7,
      },
      {
        attachments: [{ file: decision }],
        magistrat: { currentPositionId: '8', status: 'ACTIVE' },
        magistratId: 'moved',
        positionId: 7,
      },
    ] as never);

    await expect(deleteLapsed()).resolves.toBe(1);

    expect(prisma.positionVacancy.deleteMany).toHaveBeenCalledExactlyOnceWith({
      where: { OR: [{ magistratId: 'moved', positionId: 7 }] },
    });
    expect(files.delete).toHaveBeenCalledExactlyOnceWith([decision]);
  });
});
