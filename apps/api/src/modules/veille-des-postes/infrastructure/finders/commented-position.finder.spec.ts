import { NotFoundException } from '@nestjs/common';
import { mock, type MockProxy } from 'vitest-mock-extended';

import type { JurisdictionDelegate } from '../../../../generated/prisma/models';
import { Clock } from '../../../framework/clock';
import { transactionalTest } from '../../../framework/database/transactional-test';

import { CommentedPositionFinder } from './commented-position.finder';
import type { HeldPosition, HeldPositionFinder } from './held-position.finder';

const HELD: HeldPosition = {
  birthDate: null,
  civility: null,
  courtId: 'TJ  GRASSE',
  installationDate: null,
  positionId: 7,
  watched: 'JUDICIAL_COURT_PRESIDENT',
};

describe('CommentedPositionFinder', () => {
  let heldPositions: MockProxy<HeldPositionFinder>;
  let ofCourt: (courtId: string) => Promise<unknown>;
  let ofHolder: (magistratId: string) => Promise<unknown>;
  let prisma: {
    $transaction: (fn: (client: object) => Promise<unknown>) => Promise<unknown>;
    jurisdiction: MockProxy<JurisdictionDelegate>;
  };

  beforeEach(async () => {
    heldPositions = mock();
    prisma = { $transaction: (fn) => fn(prisma), jurisdiction: mock() };
    const { db, inTransaction } = await transactionalTest(prisma);
    const finder = new CommentedPositionFinder(new Clock(), db, heldPositions);

    ofCourt = (courtId) => inTransaction(() => finder.ofCourt({ courtId }));
    ofHolder = (magistratId) => inTransaction(() => finder.ofHolder({ magistratId }));
  });

  it('does not find a court that no table lists', async () => {
    prisma.jurisdiction.findUnique.mockResolvedValue({ dateSuppression: null, typeJur: 'CC' } as never);

    await expect(ofCourt('CC  PARIS')).rejects.toThrow(NotFoundException);
  });

  it('does not find a removed court', async () => {
    prisma.jurisdiction.findUnique.mockResolvedValue({
      dateSuppression: new Date('2011-03-31'),
      typeJur: 'TJ',
    } as never);

    await expect(ofCourt('TJ  MAMOUDZOU')).rejects.toThrow(NotFoundException);
  });

  it('does not find an unknown court', async () => {
    prisma.jurisdiction.findUnique.mockResolvedValue(null);

    await expect(ofCourt('TJ  NULLE PART')).rejects.toThrow(NotFoundException);
  });

  it('finds a court whose head a table lists', async () => {
    prisma.jurisdiction.findUnique.mockResolvedValue({ dateSuppression: null, typeJur: 'TJ' } as never);

    await expect(ofCourt('TJ  GRASSE')).resolves.toEqual({ courtId: 'TJ  GRASSE' });
  });

  it('gives a holder of the Cour de cassation a comment of their own', async () => {
    heldPositions.byHolder.mockResolvedValue({ ...HELD, courtId: 'CC  PARIS', watched: 'COUNSELLOR' });

    await expect(ofHolder('magistrat')).resolves.toEqual({ magistratId: 'magistrat', positionId: 7 });
  });

  it('gives the head of a court the comment of their court', async () => {
    heldPositions.byHolder.mockResolvedValue(HELD);

    await expect(ofHolder('magistrat')).resolves.toEqual({ courtId: 'TJ  GRASSE' });
  });
});
