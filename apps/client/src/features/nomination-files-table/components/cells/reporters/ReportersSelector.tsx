import { useMemo } from 'react';
import { FormattedMessage } from 'react-intl';

import { useNominationFilesTable } from '../../../context/files-table.context';
import { useAffectationRow } from '@/features/nomination-files-table/context/files-affectations.context';
import {
  useExcludedJurisdictionConflicts,
  useExcludedJurisdictionTitles,
} from '@/features/nomination-files-table/hooks/useExcludedJurisdictionConflicts.hook';
import { UserAvatarList } from '@/shared/components/user-avatar';
import { useMemberListQuery } from '@queries/members.queries';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { ExcludedJurisdictionAlert } from './ExcludedJurisdictionAlert';
import { MissingSecondReporterAlert } from './MissingSecondReporterAlert';
import { RapporteursDropdownBase } from './RapporteursDropdownBase';

export function ReportersSelector(props: { file: SessionNominationFile }) {
  const { formation } = useNominationFilesTable();
  const { data } = useMemberListQuery({
    formations: ['COMMUN', formation],
    pagination: { pageIndex: 0, pageSize: 100 },
  });

  const reporters = useMemo(
    () =>
      (data?.items ?? []).map((r) => ({
        userId: r.id,
        firstName: r.firstName,
        lastName: r.lastName,
      })),
    [data],
  );

  const { reporterIds, affectReporters } = useAffectationRow(props.file.id);
  const selectedReporters = useMemo(() => reporterIds ?? [], [reporterIds]);

  const reporterMap = useMemo(
    () => new Map(reporters.map((reporter) => [reporter.userId, reporter] as const)),
    [reporters],
  );
  const files = useMemo(() => [props.file], [props.file]);
  const availableIds = useMemo(() => reporters.map(({ userId }) => userId), [reporters]);
  const conflicts = useExcludedJurisdictionConflicts({ files, memberIds: availableIds });
  const excludedTitleByRapporteurId = useExcludedJurisdictionTitles(conflicts);

  const selectedUsers = useMemo(
    () =>
      selectedReporters
        .map((id) => reporterMap.get(id))
        .filter((reporter): reporter is NonNullable<typeof reporter> => Boolean(reporter))
        .map((reporter) => {
          const memberConflicts = conflicts.filter(({ memberId }) => memberId === reporter.userId);

          return {
            ...reporter,
            icon:
              memberConflicts.length > 0 ? (
                <ExcludedJurisdictionAlert conflicts={memberConflicts} />
              ) : undefined,
          };
        }),
    [conflicts, reporterMap, selectedReporters],
  );

  const buttonLabel =
    selectedUsers.length > 0 ? (
      <UserAvatarList users={selectedUsers} size="sm" />
    ) : (
      <FormattedMessage defaultMessage="Sélectionner" />
    );

  return (
    <div className="flex items-center">
      <MissingSecondReporterAlert dossier={props.file} selectedReportersCount={selectedReporters.length} />
      <RapporteursDropdownBase
        availableRapporteurs={reporters}
        excludedTitleByRapporteurId={excludedTitleByRapporteurId}
        selectedRapporteurs={selectedReporters}
        onSelectionChange={affectReporters}
        buttonLabel={buttonLabel}
      />
    </div>
  );
}
