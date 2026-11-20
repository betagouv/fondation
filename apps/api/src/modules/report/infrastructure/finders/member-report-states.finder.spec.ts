import { type Mock } from 'vitest';

import { transactionalTest } from '../../../framework/database/transactional-test';

import { MemberReportStatesFinder } from './member-report-states.finder';

describe('MemberReportStatesFinder', () => {
  let find: (sessionIds: string[]) => Promise<unknown>;
  let prisma: {
    $transaction: (fn: (client: object) => Promise<unknown>) => Promise<unknown>;
    report: { groupBy: Mock };
  };

  beforeEach(async () => {
    prisma = { $transaction: (fn) => fn(prisma), report: { groupBy: vi.fn() } };
    const { db, inTransaction } = await transactionalTest(prisma);
    const finder = new MemberReportStatesFinder(db);

    find = (sessionIds) => inTransaction(() => finder.find({ reporterId: 'member', sessionIds }));
  });

  it("counts the member's reports of each session by state", async () => {
    prisma.report.groupBy.mockResolvedValue([
      { _count: { _all: 2 }, sessionId: 'abc', state: 'NEW' },
      { _count: { _all: 1 }, sessionId: 'abc', state: 'SUPPORTED' },
      { _count: { _all: 3 }, sessionId: 'xyz', state: 'IN_PROGRESS' },
    ]);

    await expect(find(['abc', 'xyz'])).resolves.toEqual(
      new Map([
        ['abc', { IN_PROGRESS: 0, NEW: 2, READY_TO_SUPPORT: 0, SUPPORTED: 1 }],
        ['xyz', { IN_PROGRESS: 3, NEW: 0, READY_TO_SUPPORT: 0, SUPPORTED: 0 }],
      ]),
    );
  });

  it('only counts the reports the member still holds', async () => {
    prisma.report.groupBy.mockResolvedValue([]);

    await find(['abc']);

    expect(prisma.report.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isDeleted: false, reporterId: 'member', sessionId: { in: ['abc'] } },
      }),
    );
  });
});
