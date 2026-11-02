import { FormattedMessage } from 'react-intl';

import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import type { RecusedMembersDto } from '@api/types';
import { useRecuseMembersMutation, type SessionNominationFile } from '@queries/nomination-sessions.queries';

import { RecusedMemberSelect } from './RecusedMemberSelect';

export function RecusedMembers(props: {
  nominationFile: SessionNominationFile;
  recusedMembers: RecusedMembersDto['recusedMembers'];
}) {
  const { nominationFile, recusedMembers } = props;
  const { sessionId } = useNominationFilesTable();
  const { isError: saveFailed, isPending, mutate, variables } = useRecuseMembersMutation(nominationFile.id);
  const selected = isPending ? variables.memberIds : recusedMembers.map(({ id }) => id);

  const recuse = (memberIds: string[]) => mutate({ memberIds, sessionId });

  return (
    <div className="fr-mb-2v">
      <RecusedMemberSelect
        disabled={!nominationFile.canRecuseMembers}
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
