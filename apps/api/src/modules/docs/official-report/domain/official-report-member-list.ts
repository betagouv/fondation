import { unaccent } from '../../../../utils/unaccent';

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

    for (const [id, member] of this.members) {
      if (other.members.get(id)?.isAbsent !== member.isAbsent) return false;
    }

    return true;
  }

  /** a member recorded at the meeting stays once no longer offered (deactivated since, or moved to another formation) */
  keepingRecorded(recorded: OfficialReportMembersList): OfficialReportMembersList {
    const kept = recorded.members.entries().filter(([id]) => !this.members.has(id));
    return new OfficialReportMembersList(new Map([...this.members, ...kept]));
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
