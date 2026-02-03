import Tooltip from '@codegouvfr/react-dsfr/Tooltip';

import { useNominationFilesTable } from '@/components/shared/nomination-files-table/contexts/files-table.context';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { ReportersAlert } from './ReportersAlert';
import { ReportersSelector } from './ReportersSelector';

function ReadOnlyReportersCell(props: { dossier: SessionNominationFile }) {
  if (props.dossier.reporters.length === 0) return '-';

  return (
    <div className="flex items-center">
      <ReportersAlert dossier={props.dossier} />
      <ul className="m-0 flex list-none flex-col gap-x-1 p-0">
        {props.dossier.reporters.map(({ id, firstName, lastName }) => (
          <li className="p-0" key={id}>
            {`${firstName} ${lastName}`.toUpperCase()}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReportersCell(props: { dossier: SessionNominationFile }) {
  const { edition } = useNominationFilesTable();

  if (edition?.isEditing && props.dossier.content.outcome) {
    return (
      <Tooltip title="issue renseignée">
        <ReadOnlyReportersCell dossier={props.dossier} />
      </Tooltip>
    );
  }

  if (edition?.isEditing) {
    return <ReportersSelector file={props.dossier} />;
  }

  return <ReadOnlyReportersCell dossier={props.dossier} />;
}
