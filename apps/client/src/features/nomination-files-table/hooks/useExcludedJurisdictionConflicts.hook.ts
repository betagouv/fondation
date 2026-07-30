import { useMemo } from 'react';
import { useIntl } from 'react-intl';

import { useNominationFilesTable } from '../context/files-table.context';
import { useIsSg } from '@/features/auth/hooks/roles.hook';
import { memberFullName } from '@/utils/user.utils';
import { useMemberListQuery } from '@queries/members.queries';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

type MemberExcludedJurisdictions = {
  excludedJurisdictions: readonly { id: string; label: string | null }[];
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

export function findExcludedJurisdictionConflicts(props: {
  files: readonly SessionNominationFile[];
  memberIds: readonly string[];
  members: readonly MemberExcludedJurisdictions[];
}): ExcludedJurisdictionConflict[] {
  const members = props.members.filter(({ id }) => props.memberIds.includes(id));
  if (members.length === 0) return [];

  return props.files.flatMap((file) => {
    const { current, targeted } = file.content.jurisdictions;
    const jurisdictions = new Set([current, targeted].filter((id): id is string => !!id));
    if (jurisdictions.size === 0) return [];

    return members.flatMap((member) =>
      member.excludedJurisdictions
        .filter(({ id }) => jurisdictions.has(id))
        .map((excluded) => ({
          fileId: file.id,
          fileNumber: file.content.numeroDeDossier,
          jurisdiction: excluded.label ?? excluded.id,
          memberId: member.id,
          memberName: memberFullName(member),
        })),
    );
  });
}

function jurisdictionsByMember(
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
    const line = lines.get(jurisdictions.join()) ?? { jurisdictions, memberNames: [] };
    line.memberNames.push(memberName);
    lines.set(jurisdictions.join(), line);
  }

  return [...lines.values()];
}

export function useExcludedJurisdictionTitles(
  conflicts: readonly ExcludedJurisdictionConflict[],
): ReadonlyMap<string, string> {
  const { formatList, formatMessage } = useIntl();

  return useMemo(
    () =>
      new Map(
        [...jurisdictionsByMember(conflicts)].map(([memberId, { jurisdictions, memberName }]) => [
          memberId,
          formatMessage(
            {
              defaultMessage:
                '{count, plural, one {Juridiction exclue} other {Juridictions exclues}} pour {memberName} : {jurisdictions}',
            },
            { count: jurisdictions.length, jurisdictions: formatList(jurisdictions), memberName },
          ),
        ]),
      ),
    [conflicts, formatList, formatMessage],
  );
}

export function useExcludedJurisdictionConflicts(props: {
  files: readonly SessionNominationFile[];
  memberIds: readonly string[];
}): ExcludedJurisdictionConflict[] {
  const { formation } = useNominationFilesTable();
  const isSg = useIsSg();
  const { data } = useMemberListQuery({
    enabled: isSg,
    formations: ['COMMUN', formation],
    pagination: { pageIndex: 0, pageSize: 100 },
  });

  const { files, memberIds } = props;

  return useMemo(
    () => findExcludedJurisdictionConflicts({ files, memberIds, members: data?.items ?? [] }),
    [data, files, memberIds],
  );
}
