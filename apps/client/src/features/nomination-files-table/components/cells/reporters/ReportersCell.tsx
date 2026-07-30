import { useMemo } from 'react';

import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import { useExcludedJurisdictionConflicts } from '@/features/nomination-files-table/hooks/useExcludedJurisdictionConflicts.hook';
import { UserAvatarList } from '@/shared/components/user-avatar';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { ExcludedJurisdictionAlert } from './ExcludedJurisdictionAlert';
import { MissingSecondReporterAlert } from './MissingSecondReporterAlert';
import { ReportersSelector } from './ReportersSelector';

function ReadOnlyReportersCell(props: { dossier: SessionNominationFile }) {
  const files = useMemo(() => [props.dossier], [props.dossier]);
  const memberIds = useMemo(() => props.dossier.reporters.map(({ id }) => id), [props.dossier]);
  const conflicts = useExcludedJurisdictionConflicts({ files, memberIds });

  const users = useMemo(
    () =>
      props.dossier.reporters.map((reporter) => {
        const memberConflicts = conflicts.filter(({ memberId }) => memberId === reporter.id);

        return {
          ...reporter,
          icon:
            memberConflicts.length > 0 ? (
              <ExcludedJurisdictionAlert conflicts={memberConflicts} />
            ) : undefined,
        };
      }),
    [conflicts, props.dossier.reporters],
  );

  if (props.dossier.reporters.length === 0) return '-';

  return (
    <div className="flex items-center">
      <MissingSecondReporterAlert dossier={props.dossier} />
      <UserAvatarList users={users} size="sm" />
    </div>
  );
}

export function ReportersCell(props: { dossier: SessionNominationFile }) {
  const { edition } = useNominationFilesTable();

  if (edition?.isEditing && props.dossier.content.isUpdatable) {
    return <ReportersSelector file={props.dossier} />;
  }

  return <ReadOnlyReportersCell dossier={props.dossier} />;
}
