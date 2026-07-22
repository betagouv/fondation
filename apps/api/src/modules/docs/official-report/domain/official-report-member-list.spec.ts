import { OfficialReportMember } from './official-report-member';
import { EmptyMembersList, OfficialReportMembersList } from './official-report-member-list';
import * as helpers from './official-report-test-utils';

describe('OfficialReportMembersList', () => {
  it('should prevent creating a list without member', () => {
    expect(() => OfficialReportMembersList.from([])).toThrow(EmptyMembersList);
  });

  it('should prevent creating a list without present member', () => {
    expect(() =>
      OfficialReportMembersList.from([
        makeMember({ isAbsent: true }),
        makeMember({ isAbsent: true }),
        makeMember({ isAbsent: true }),
      ]),
    ).toThrow(EmptyMembersList);
  });

  it('should allow creating a list with at least one present member', () => {
    expect(() =>
      OfficialReportMembersList.from([
        makeMember({ isAbsent: false }),
        makeMember({ isAbsent: true }),
        makeMember({ isAbsent: true }),
      ]),
    ).not.toThrow(EmptyMembersList);
  });

  it('should map on members', () => {
    const result = OfficialReportMembersList.from([
      makeMember({ id: 'member-1', isAbsent: false }),
      makeMember({ id: 'member-2', isAbsent: false }),
      makeMember({ id: 'member-3', isAbsent: false }),
    ]).map((x) => x.id);

    expect(result).toEqual(['member-1', 'member-2', 'member-3']);
  });

  it('should compare 2 lists, and be true, when all ids appear in both lists', () => {
    const list1 = OfficialReportMembersList.from([
      makeMember({ id: 'member-1', isAbsent: false }),
      makeMember({ id: 'member-2', isAbsent: false }),
      makeMember({ id: 'member-3', isAbsent: false }),
    ]);

    const list2 = OfficialReportMembersList.from([
      makeMember({ id: 'member-1', isAbsent: false }),
      makeMember({ id: 'member-2', isAbsent: false }),
      makeMember({ id: 'member-3', isAbsent: false }),
    ]);

    expect(list1.equals(list2)).toBe(true);
  });

  it('should compare 2 lists, and be false, when the compared list has more ids', () => {
    const list1 = OfficialReportMembersList.from([
      makeMember({ id: 'member-1', isAbsent: false }),
      makeMember({ id: 'member-2', isAbsent: false }),
      makeMember({ id: 'member-3', isAbsent: false }),
    ]);

    const list2 = OfficialReportMembersList.from([
      makeMember({ id: 'member-1', isAbsent: false }),
      makeMember({ id: 'member-2', isAbsent: false }),
      makeMember({ id: 'member-3', isAbsent: false }),
      makeMember({ id: 'member-4', isAbsent: false }),
    ]);

    expect(list1.equals(list2)).toBe(false);
  });

  it('should compare 2 lists, and be false, when the compared list has an unknown id', () => {
    const list1 = OfficialReportMembersList.from([
      makeMember({ id: 'member-1', isAbsent: false }),
      makeMember({ id: 'member-2', isAbsent: false }),
      makeMember({ id: 'member-3', isAbsent: false }),
    ]);

    const list2 = OfficialReportMembersList.from([
      makeMember({ id: 'member-1', isAbsent: false }),
      makeMember({ id: 'member-2', isAbsent: false }),
      makeMember({ id: 'member-4', isAbsent: false }),
    ]);

    expect(list1.equals(list2)).toBe(false);
  });
});

function makeMember(
  props: Partial<Parameters<(typeof OfficialReportMember)['from']>[0]>,
): OfficialReportMember {
  return OfficialReportMember.from(helpers.makeMember(props));
}
