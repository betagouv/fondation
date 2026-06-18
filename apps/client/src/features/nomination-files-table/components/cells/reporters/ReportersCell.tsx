import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import { UserAvatarList } from '@/shared/components/user-avatar';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { ReportersAlert } from './ReportersAlert';
import { ReportersSelector } from './ReportersSelector';

function ReadOnlyReportersCell(props: { dossier: SessionNominationFile }) {
  if (props.dossier.reporters.length === 0) return '-';

  return (
    <div className="flex items-center">
      <ReportersAlert dossier={props.dossier} />
      <UserAvatarList users={props.dossier.reporters} size="sm" />
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
