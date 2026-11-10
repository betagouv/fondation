import { nonAffectableMembers, nonRecusableMembers } from './member-recusal';

describe('nonAffectableMembers', () => {
  it('keeps every member recused from the file out of its reporters', () => {
    expect(
      nonAffectableMembers({ assignedReporterIds: new Set(), recusedIds: new Set(['member-1', 'member-2']) }),
    ).toEqual([
      { id: 'member-1', reason: 'RECUSED' },
      { id: 'member-2', reason: 'RECUSED' },
    ]);
  });

  it('keeps a reporter recused before the rule in their place', () => {
    expect(
      nonAffectableMembers({ assignedReporterIds: new Set(['member-1']), recusedIds: new Set(['member-1']) }),
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
