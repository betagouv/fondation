import { unaccent } from 'src/utils/unaccent';

import { OfficialReportMember } from './official-report-member';

export class OfficialReportMembersList {
  private constructor(readonly members: Map<string, OfficialReportMember>) {}

  toSortedArray(): readonly OfficialReportMember[] {
    return this.members
      .values()
      .toArray()
      .sort((a, b) => a.sort - b.sort || unaccent(a.lastName).localeCompare(unaccent(b.lastName)));
  }

  map<U>(mapper: (value: OfficialReportMember) => U): U[] {
    return this.members.values().toArray().map(mapper);
  }

  equals(other: OfficialReportMembersList): boolean {
    if (this.members.size !== other.members.size) return false;

    for (const id of this.members.keys()) {
      if (!other.members.has(id)) return false;
    }

    return true;
  }

  static from(members: readonly OfficialReportMember[]) {
    let presentCount = 0;
    const map = new Map<string, OfficialReportMember>();

    for (const member of members) {
      if (!member.isAbsent) presentCount += 1;

      map.set(member.id, member);
    }

    if (presentCount === 0) {
      throw new EmptyMembersList();
    }

    return new OfficialReportMembersList(map);
  }
}

export class EmptyMembersList extends Error {}
