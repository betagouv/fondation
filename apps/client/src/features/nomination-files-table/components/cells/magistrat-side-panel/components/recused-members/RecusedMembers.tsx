import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import { Dropdown } from '@/shared/ui/dropdown';
import { memberFullName } from '@/utils/user.utils';
import { useMemberListQuery } from '@queries/members.queries';
import {
  isUpdatable,
  useRecuseMembersMutation,
  type SessionNominationFile,
} from '@queries/nomination-sessions.queries';

const MEMBER_TAG =
  'fr-tag font-normal! gap-1.5 bg-(--background-default-grey)! text-(--text-action-high-blue-france)!';

export function RecusedMembers(props: { nominationFile: SessionNominationFile; sessionId: string }) {
  const { nominationFile, sessionId } = props;
  const { recusedMembers } = nominationFile;
  const { formation } = useNominationFilesTable();
  const { data } = useMemberListQuery({
    formations: ['COMMUN', formation],
    pagination: { pageIndex: 0, pageSize: 100 },
  });
  const { isError: saveFailed, mutate } = useRecuseMembersMutation();
  const [selected, setSelected] = useState(() => recusedMembers.map(({ id }) => id));

  // the recused members come first, in the protocol order the official report prints, and a member deactivated since stays among them
  const recusedIds = new Set(recusedMembers.map(({ id }) => id));
  const otherMembers = (data?.items ?? [])
    .filter(({ id }) => !recusedIds.has(id))
    .sort((a, b) => a.lastName.localeCompare(b.lastName));
  const options = [...recusedMembers, ...otherMembers].map((member) => ({
    label: <span className={MEMBER_TAG}>{memberFullName(member)}</span>,
    value: member.id,
  }));

  const recuse = (memberIds: string[]) => {
    setSelected(memberIds);
    mutate(
      { memberIds, nominationFileId: nominationFile.id, sessionId },
      { onError: () => setSelected(recusedMembers.map(({ id }) => id)) },
    );
  };

  return (
    <div className="fr-mb-2v">
      <Dropdown
        disabled={!isUpdatable(nominationFile)}
        label={<FormattedMessage defaultMessage="Ajouter un membre qui se déporte" />}
        multiple
        onSelect={recuse}
        options={options}
        placeholder={<FormattedMessage defaultMessage="Sélectionner" />}
        selected={selected}
      />
      {saveFailed && (
        <p className="fr-error-text fr-mb-0" role="alert">
          <FormattedMessage defaultMessage="L'enregistrement a échoué" />
        </p>
      )}
    </div>
  );
}
