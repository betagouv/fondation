import { nonRecusableMembers } from './member-recusal';

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
