import { defineMessage, FormattedMessage, useIntl, type MessageDescriptor } from 'react-intl';

import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import { MemberTagSelect } from '@/shared/components/member-tag-select';
import { memberFullName } from '@/utils/user.utils';
import type { RecusedMembersDto } from '@api/types';
import { useMemberListQuery } from '@queries/members.queries';
import { useRecuseMembersMutation, type SessionNominationFile } from '@queries/nomination-sessions.queries';

const NON_RECUSABLE_LABELS = {
  REPORTER: defineMessage({ defaultMessage: '{name} (rapporteur)' }),
} satisfies Record<SessionNominationFile['nonRecusableMembers'][number]['reason'], MessageDescriptor>;

export function RecusedMembers(props: {
  nominationFile: SessionNominationFile;
  recusedMembers: RecusedMembersDto['recusedMembers'];
}) {
  const { nominationFile, recusedMembers } = props;
  const { formation, sessionId } = useNominationFilesTable();
  const { isError: saveFailed, isPending, mutate, variables } = useRecuseMembersMutation(nominationFile.id);
  const { formatMessage } = useIntl();
  const { data } = useMemberListQuery({
    formations: ['COMMUN', formation],
    pagination: { pageIndex: 0, pageSize: 100 },
  });

  const selectedIds = isPending ? variables.memberIds : recusedMembers.map(({ id }) => id);
  // a member deactivated since stays among the recused members, absent from the member list
  const members = new Map([...recusedMembers, ...(data?.items ?? [])].map((member) => [member.id, member]));
  const reasons = new Map(nominationFile.nonRecusableMembers.map(({ id, reason }) => [id, reason]));
  const recuse = (memberIds: string[]) => mutate({ memberIds, sessionId });

  return (
    <div className="fr-mb-2v">
      <MemberTagSelect
        disabled={!nominationFile.canRecuseMembers}
        hint={
          nominationFile.canRecuseMembers && (
            <FormattedMessage defaultMessage="Un rapporteur ne peut pas se déporter : retirez-le d'abord de l'affectation, puis publiez-la s'il est rapporteur dans la version publiée." />
          )
        }
        label={<FormattedMessage defaultMessage="Ajouter un membre qui se déporte" />}
        onAdd={(id) => recuse([...selectedIds, id])}
        onRemove={(id) => recuse(selectedIds.filter((selectedId) => selectedId !== id))}
        options={(data?.items ?? [])
          .filter(({ id }) => !selectedIds.includes(id))
          .sort((a, b) => a.lastName.localeCompare(b.lastName))
          .map((member) => {
            const reason = reasons.get(member.id);
            const name = memberFullName(member);
            return {
              disabled: !!reason,
              id: member.id,
              label: reason ? formatMessage(NON_RECUSABLE_LABELS[reason], { name }) : name,
            };
          })}
        placeholder={<FormattedMessage defaultMessage="Sélectionner" />}
        removeTitle={(member) =>
          formatMessage({ defaultMessage: 'Retirer le déport de {member}' }, { member })
        }
        // in protocol order, the one the official report prints, once saved: a member being added shows last until then
        selected={selectedIds.flatMap((id) => {
          const member = members.get(id);
          return member ? [{ id, label: memberFullName(member) }] : [];
        })}
      />
      {saveFailed && (
        <p className="fr-error-text fr-mb-0" role="alert">
          <FormattedMessage defaultMessage="L'enregistrement a échoué" />
        </p>
      )}
    </div>
  );
}
