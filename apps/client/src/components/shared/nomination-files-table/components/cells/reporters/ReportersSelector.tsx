import { useMemo } from 'react';

import { UserAvatarList } from '@/components/shared/user-avatar';

import { useAffectationRow } from '@/components/shared/nomination-files-table/contexts/files-affectations.context';
import { RapporteursDropdownBase } from './RapporteursDropdownBase';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';
import { ReportersAlert } from './ReportersAlert';
import { useMemberListQuery } from '@queries/members.queries';
import { useNominationFilesTable } from '../../../contexts/files-table.context';

export function ReportersSelector(props: { file: SessionNominationFile }) {
  const { formation } = useNominationFilesTable();
  const { data } = useMemberListQuery({
    formations: ['COMMUN', formation],
    pagination: { pageIndex: 0, pageSize: 100 }
  });

  const reporters = useMemo(
    () => (data?.items ?? []).map((r) => ({ userId: r.id, firstName: r.firstName, lastName: r.lastName })),
    [data]
  );

  const { reporterIds, affectReporters } = useAffectationRow(props.file.id);
  const selectedReporters = useMemo(() => reporterIds ?? [], [reporterIds]);

  const reporterMap = useMemo(
    () => new Map(reporters.map((reporter) => [reporter.userId, reporter] as const)),
    [reporters]
  );
  const selectedUsers = useMemo(
    () =>
      (selectedReporters.length ?? 0) > 0
        ? selectedReporters
            .map((id) => reporterMap.get(id))
            .filter((x): x is NonNullable<typeof x> => Boolean(x))
        : [],
    [selectedReporters, reporterMap]
  );

  const buttonLabel =
    selectedUsers.length > 0 ? <UserAvatarList users={selectedUsers} max={1} size="sm" /> : 'Sélectionner';

  return (
    <div className="flex items-center">
      <ReportersAlert dossier={props.file} selectedReportersCount={selectedReporters.length} />
      <RapporteursDropdownBase
        availableRapporteurs={reporters}
        selectedRapporteurs={selectedReporters}
        onSelectionChange={affectReporters}
        buttonLabel={buttonLabel}
      />
    </div>
  );
}
