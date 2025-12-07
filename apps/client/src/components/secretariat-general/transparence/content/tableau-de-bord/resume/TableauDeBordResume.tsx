import Alert from '@codegouvfr/react-dsfr/Alert';
import Button from '@codegouvfr/react-dsfr/Button';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';

import type { Magistrat } from 'shared-models';

import {
  updateNominationSessionMutation,
  type DetailedNominationSession
} from '../../../../../../react-query/mutations/sg/nomination-sessions';
import { TableauDeBordEditTransparence } from './TableauDeBordEditTransparence';
import { TableauDeBordResumeDetails } from './TableauDeBordResumeDetails';

export const TableauDeBordResume = (transparence: DetailedNominationSession) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => {
    setIsEditing((prev) => !prev);
  };

  const {
    isSuccess,
    isError,
    mutateAsync: updateNominationSessionAsync
  } = useMutation({
    mutationFn: updateNominationSessionMutation,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['detail-nomination-session', transparence.id] })
  });

  const onSubmit = async (data: {
    name: string;
    formation: Magistrat.Formation;
    date: string;
    observationsClosingDate: string;
    dueDate: string | null;
    positionStartDate: string | null;
  }) => {
    await updateNominationSessionAsync({ sessionId: transparence.id, data });
    toggleEdit();
  };

  return (
    <div className="fr-col flex flex-col gap-3">
      {isSuccess && (
        <Alert id="edit-transparence-success" closable severity="success" title="Données actualisées" />
      )}
      {isError && (
        <Alert
          id="edit-transparence-error"
          closable
          severity="error"
          title="Erreur lors de la modification de la transparence"
        />
      )}
      <div className={clsx('relative border-2 border-solid', cx('fr-px-12v', 'fr-py-4v'))}>
        <Button
          className={'absolute right-3 top-3'}
          priority="tertiary no outline"
          iconId={isEditing ? 'fr-icon-close-line' : 'fr-icon-edit-fill'}
          title={`edit-session-${transparence.name}`}
          onClick={toggleEdit}
        />

        <h1>Gérer une session</h1>

        <div className="flex">
          {!isEditing && <TableauDeBordResumeDetails {...transparence} />}
          {isEditing && (
            <TableauDeBordEditTransparence
              transparence={transparence}
              onCancel={toggleEdit}
              onSubmit={onSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
};
