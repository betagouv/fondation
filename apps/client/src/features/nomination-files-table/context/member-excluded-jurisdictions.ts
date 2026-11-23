import { memberFullName } from '@/utils/user.utils';

type ConflictingFile = {
  content: { numeroDeDossier: number | null };
  excludedJurisdictionConflicts: readonly {
    jurisdiction: { id: string; label: string | null };
    member: { firstName: string; id: string; lastName: string };
  }[];
  id: string;
};

export type ExcludedJurisdictionConflict = {
  fileId: string;
  fileNumber: number | null;
  jurisdiction: string;
  memberId: string;
  memberName: string;
};

export function excludedJurisdictionConflictsOf(
  file: ConflictingFile,
  memberIds: readonly string[],
): ExcludedJurisdictionConflict[] {
  return file.excludedJurisdictionConflicts
    .filter(({ member }) => memberIds.includes(member.id))
    .map(({ jurisdiction, member }) => ({
      fileId: file.id,
      fileNumber: file.content.numeroDeDossier,
      jurisdiction: jurisdiction.label ?? jurisdiction.id,
      memberId: member.id,
      memberName: memberFullName(member),
    }));
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
