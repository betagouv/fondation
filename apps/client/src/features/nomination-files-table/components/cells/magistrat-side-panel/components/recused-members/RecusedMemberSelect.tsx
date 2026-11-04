import clsx from 'clsx';
import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { MEMBER_TAG } from '../member-tag';
import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import { Dropdown } from '@/shared/ui/dropdown';
import { memberFullName } from '@/utils/user.utils';
import type { RecusedMembersDto } from '@api/types';
import { useMemberListQuery } from '@queries/members.queries';

export function RecusedMemberSelect(props: {
  disabled?: boolean;
  label: ReactNode;
  onChange: (memberIds: string[]) => void;
  recusedMembers: RecusedMembersDto['recusedMembers'];
  value: readonly string[];
}) {
  const { formation } = useNominationFilesTable();
  const { data } = useMemberListQuery({
    formations: ['COMMUN', formation],
    pagination: { pageIndex: 0, pageSize: 100 },
  });

  // the recused members come first, in the protocol order the official report prints, and a member deactivated since stays among them
  const recusedIds = props.recusedMembers.map(({ id }) => id);
  const otherMembers = (data?.items ?? [])
    .filter(({ id }) => !recusedIds.includes(id))
    .sort((a, b) => a.lastName.localeCompare(b.lastName));
  const options = [...props.recusedMembers, ...otherMembers].map((member) => ({
    label: (
      <span className={clsx(MEMBER_TAG, 'text-(--text-action-high-blue-france)!')}>
        {memberFullName(member)}
      </span>
    ),
    value: member.id,
  }));

  return (
    <Dropdown
      disabled={props.disabled}
      label={props.label}
      multiple
      onSelect={props.onChange}
      options={options}
      placeholder={<FormattedMessage defaultMessage="Sélectionner" />}
      selected={props.value}
    />
  );
}
