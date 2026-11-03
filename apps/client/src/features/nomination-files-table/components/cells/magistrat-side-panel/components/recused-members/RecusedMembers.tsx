import { FormattedMessage, useIntl } from 'react-intl';

import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import { useConfirmModal } from '@/shared/context/confirm-modal';
import { memberFullName } from '@/utils/user.utils';
import type { RecusedMembersDto } from '@api/types';
import { useRecuseMembersMutation, type SessionNominationFile } from '@queries/nomination-sessions.queries';

import { recusedReporters } from './recused-reporters';
import { RecusedMemberSelect } from './RecusedMemberSelect';

export function RecusedMembers(props: {
  nominationFile: SessionNominationFile;
  recusedMembers: RecusedMembersDto['recusedMembers'];
}) {
  const { nominationFile, recusedMembers } = props;
  const { sessionId } = useNominationFilesTable();
  const { isError: saveFailed, isPending, mutate, variables } = useRecuseMembersMutation(nominationFile.id);
  const { waitForConfirmation } = useConfirmModal();
  const { formatMessage } = useIntl();
  const selected = isPending ? variables.memberIds : recusedMembers.map(({ id }) => id);

  const recuse = async (memberIds: string[]) => {
    const added = memberIds.filter((id) => !selected.includes(id));
    const [recused] = recusedReporters([nominationFile], added);

    if (recused) {
      const { isConfirmed } = await waitForConfirmation({
        content: (
          <p>
            <FormattedMessage
              defaultMessage={`{name} est rapporteur de ce dossier. Avec ce déport, son rapport passe à « Sans objet » et en lecture seule.`}
              values={{ name: memberFullName(recused.reporter) }}
            />
          </p>
        ),
        i18n: {
          cancel: formatMessage({ defaultMessage: 'Annuler' }),
          confirm: formatMessage({ defaultMessage: 'Déporter' }),
        },
        title: formatMessage({ defaultMessage: 'Déporter un rapporteur' }),
      });
      if (!isConfirmed) return;
    }

    mutate({ memberIds, sessionId });
  };

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
