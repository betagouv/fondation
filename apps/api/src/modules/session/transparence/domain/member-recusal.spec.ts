import { nonAffectableMembers, nonRecusableMembers, refusedReporters } from './member-recusal';

describe('nonAffectableMembers', () => {
  it('keeps every member recused from the file out of its reporters', () => {
    expect(
      nonAffectableMembers({
        magistratExcludedIds: new Set(),
        recusedIds: new Set(['member-1', 'member-2']),
      }),
    ).toEqual([
      { id: 'member-1', reason: 'RECUSED' },
      { id: 'member-2', reason: 'RECUSED' },
    ]);
  });

  it('keeps every member who excluded the proposed magistrat out of its reporters', () => {
    expect(
      nonAffectableMembers({ magistratExcludedIds: new Set(['member-1']), recusedIds: new Set() }),
    ).toEqual([{ id: 'member-1', reason: 'EXCLUDED_MAGISTRAT' }]);
  });

  it('gives the recusal of a member who also excluded the magistrat', () => {
    expect(
      nonAffectableMembers({
        magistratExcludedIds: new Set(['member-1']),
        recusedIds: new Set(['member-1']),
      }),
    ).toEqual([{ id: 'member-1', reason: 'RECUSED' }]);
  });
});

describe('refusedReporters', () => {
  const file = {
    assignedIds: new Set<string>(),
    magistratExcludedIds: new Set<string>(),
    recusedIds: new Set<string>(),
  };

  it('refuses a member who excluded the proposed magistrat', () => {
    expect(
      refusedReporters({ ...file, magistratExcludedIds: new Set(['member-1']), reporterIds: ['member-1'] }),
    ).toEqual([{ id: 'member-1', reason: 'EXCLUDED_MAGISTRAT' }]);
  });

  it('keeps a reporter in place who excluded the magistrat afterwards', () => {
    expect(
      refusedReporters({
        ...file,
        assignedIds: new Set(['member-1']),
        magistratExcludedIds: new Set(['member-1']),
        reporterIds: ['member-1'],
      }),
    ).toEqual([]);
  });

  it('refuses a recused member even in place', () => {
    expect(
      refusedReporters({
        ...file,
        assignedIds: new Set(['member-1']),
        recusedIds: new Set(['member-1']),
        reporterIds: ['member-1'],
      }),
    ).toEqual([{ id: 'member-1', reason: 'RECUSED' }]);
  });

  it('ignores a non affectable member the affectation does not name', () => {
    expect(
      refusedReporters({ ...file, magistratExcludedIds: new Set(['member-1']), reporterIds: ['member-2'] }),
    ).toEqual([]);
  });
});

describe('nonRecusableMembers', () => {
  it('keeps a published reporter removed from the latest version, whose report still exists', () => {
    expect(nonRecusableMembers({ latestIds: new Set(), publishedIds: new Set(['member-1']) })).toEqual([
      { id: 'member-1', reason: 'REPORTER' },
    ]);
  });

  it('keeps a reporter of the latest version only, who becomes one once it is published', () => {
    expect(nonRecusableMembers({ latestIds: new Set(['member-1']), publishedIds: new Set() })).toEqual([
      { id: 'member-1', reason: 'REPORTER' },
    ]);
  });

  it('lists a reporter of both versions once', () => {
    expect(
      nonRecusableMembers({ latestIds: new Set(['member-1']), publishedIds: new Set(['member-1']) }),
    ).toEqual([{ id: 'member-1', reason: 'REPORTER' }]);
  });

  it('lets every member recuse themselves on a file without reporter', () => {
    expect(nonRecusableMembers({ latestIds: new Set(), publishedIds: new Set() })).toEqual([]);
  });
});
