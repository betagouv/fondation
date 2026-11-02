import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import {
  isUpdatable,
  useRecuseMembersMutation,
  type SessionNominationFile,
} from '@queries/nomination-sessions.queries';

import { RecusedMemberSelect } from './RecusedMemberSelect';

export function RecusedMembers(props: { nominationFile: SessionNominationFile }) {
  const { nominationFile } = props;
  const { recusedMembers } = nominationFile;
  const { sessionId } = useNominationFilesTable();
  const { isError: saveFailed, mutate } = useRecuseMembersMutation(nominationFile.id);
  const recusedIds = recusedMembers.map(({ id }) => id);
  const [selected, setSelected] = useState(recusedIds);

  const recuse = (memberIds: string[]) => {
    setSelected(memberIds);
    mutate({ memberIds, sessionId }, { onError: () => setSelected(recusedIds) });
  };

  return (
    <div className="fr-mb-2v">
      <RecusedMemberSelect
        disabled={!isUpdatable(nominationFile)}
        label={<FormattedMessage defaultMessage="Ajouter un membre qui se déporte" />}
        onChange={recuse}
        recusedMembers={recusedMembers}
        value={selected}
      />
      {saveFailed && (
        <p className="fr-error-text fr-mb-0" role="alert">
          <FormattedMessage defaultMessage="L'enregistrement a échoué" />
        </p>
      )}
    </div>
  );
}
