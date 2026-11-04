import clsx from 'clsx';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { MEMBER_TAG } from '../member-tag';
import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import { Dropdown } from '@/shared/ui/dropdown';
import { memberFullName } from '@/utils/user.utils';
import type { RecusedMembersDto } from '@api/types';
import { useMemberListQuery } from '@queries/members.queries';
import { useRecuseMembersMutation, type SessionNominationFile } from '@queries/nomination-sessions.queries';

export function RecusedMembers(props: {
  nominationFile: SessionNominationFile;
  recusedMembers: RecusedMembersDto['recusedMembers'];
}) {
  const { nominationFile, recusedMembers } = props;
  const { formation, sessionId } = useNominationFilesTable();
  const { data } = useMemberListQuery({
    formations: ['COMMUN', formation],
    pagination: { pageIndex: 0, pageSize: 100 },
  });
  const { isError: saveFailed, mutate } = useRecuseMembersMutation(nominationFile.id);
  const recusedIds = recusedMembers.map(({ id }) => id);
  const [selected, setSelected] = useState(recusedIds);

  // the recused members come first, in the protocol order the official report prints, and a member deactivated since stays among them
  const otherMembers = (data?.items ?? [])
    .filter(({ id }) => !recusedIds.includes(id))
    .sort((a, b) => a.lastName.localeCompare(b.lastName));
  const options = [...recusedMembers, ...otherMembers].map((member) => ({
    label: (
      <span className={clsx(MEMBER_TAG, 'text-(--text-action-high-blue-france)!')}>
        {memberFullName(member)}
      </span>
    ),
    value: member.id,
  }));

  const recuse = (memberIds: string[]) => {
    setSelected(memberIds);
    mutate({ memberIds, sessionId }, { onError: () => setSelected(recusedIds) });
  };

  return (
    <div className="fr-mb-2v">
      <Dropdown
        disabled={!nominationFile.canRecuseMembers}
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
