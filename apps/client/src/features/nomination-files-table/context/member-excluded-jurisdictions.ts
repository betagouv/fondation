import { memberFullName } from '@/utils/user.utils';

type Jurisdiction = { id: string; label: string | null };

type ConflictingFile = {
  content: {
    jurisdictions: { current: Jurisdiction | null; targeted: Jurisdiction | null };
    numeroDeDossier: number | null;
  };
  id: string;
};

type Member = {
  excludedJurisdictions: readonly Jurisdiction[];
  firstName: string;
  id: string;
  lastName: string;
};

export type ExcludedJurisdictionConflict = {
  fileId: string;
  fileNumber: number | null;
  jurisdiction: string;
  memberId: string;
  memberName: string;
};

export class MemberExcludedJurisdictions {
  private constructor(
    private readonly membersByExcludedJurisdictionId: ReadonlyMap<
      string,
      { excluded: Jurisdiction; member: Member }[]
    >,
  ) {}

  static fromMembers(members: readonly Member[]): MemberExcludedJurisdictions {
    const byJurisdictionId = new Map<string, { excluded: Jurisdiction; member: Member }[]>();

    for (const member of members) {
      for (const excluded of member.excludedJurisdictions) {
        const entries = byJurisdictionId.get(excluded.id) ?? [];
        entries.push({ excluded, member });
        byJurisdictionId.set(excluded.id, entries);
      }
    }

    return new MemberExcludedJurisdictions(byJurisdictionId);
  }

  conflictsFor(file: ConflictingFile, memberIds: readonly string[]): ExcludedJurisdictionConflict[] {
    const { current, targeted } = file.content.jurisdictions;
    const jurisdictions = new Map(
      [current, targeted]
        .filter((jurisdiction): jurisdiction is Jurisdiction => !!jurisdiction)
        .map((jurisdiction) => [jurisdiction.id, jurisdiction]),
    );

    return [...jurisdictions.values()].flatMap((jurisdiction) =>
      (this.membersByExcludedJurisdictionId.get(jurisdiction.id) ?? [])
        .filter(({ member }) => memberIds.includes(member.id))
        .map(({ excluded, member }) => ({
          fileId: file.id,
          fileNumber: file.content.numeroDeDossier,
          jurisdiction: jurisdiction.label ?? excluded.label ?? jurisdiction.id,
          memberId: member.id,
          memberName: memberFullName(member),
        })),
    );
  }
}

export function jurisdictionsByMember(
  conflicts: readonly ExcludedJurisdictionConflict[],
): Map<string, { jurisdictions: string[]; memberName: string }> {
  const byMember = new Map<string, { jurisdictions: string[]; memberName: string }>();

  for (const { jurisdiction, memberId, memberName } of conflicts) {
    const member = byMember.get(memberId) ?? { jurisdictions: [], memberName };
    if (!member.jurisdictions.includes(jurisdiction)) member.jurisdictions.push(jurisdiction);
    byMember.set(memberId, member);
  }

  for (const { jurisdictions } of byMember.values()) {
    jurisdictions.sort((a, b) => a.localeCompare(b));
  }

  return byMember;
}

export function excludedJurisdictionLines(
  conflicts: readonly ExcludedJurisdictionConflict[],
): { jurisdictions: string[]; memberNames: string[] }[] {
  const lines = new Map<string, { jurisdictions: string[]; memberNames: string[] }>();

  for (const { jurisdictions, memberName } of jurisdictionsByMember(conflicts).values()) {
    const key = JSON.stringify(jurisdictions);
    const line = lines.get(key) ?? { jurisdictions, memberNames: [] };
    line.memberNames.push(memberName);
    lines.set(key, line);
  }

  return [...lines.values()];
}
