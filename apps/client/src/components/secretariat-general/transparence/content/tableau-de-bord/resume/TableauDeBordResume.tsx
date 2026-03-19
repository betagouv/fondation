import Button from '@codegouvfr/react-dsfr/Button';
import { cx } from '@codegouvfr/react-dsfr/fr/cx';
import clsx from 'clsx';
import { useState } from 'react';

import type { DetailedNominationSessionDto } from '@api/types';
import {
  useUpdateNominationSessionMutation,
  useValidateSessionMutation
} from '@queries/nomination-sessions.queries';

import { useAlerts } from '@/components/shared/alerts/alerts.context';
import { useUser } from '@queries/auth.queries';
import { TableauDeBordEditTransparence } from './TableauDeBordEditTransparence';
import { TableauDeBordResumeDetails } from './TableauDeBordResumeDetails';

export const TableauDeBordResume = (transparence: DetailedNominationSessionDto) => {
  const { user } = useUser();
  const alerts = useAlerts();
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => {
    setIsEditing((prev) => !prev);
  };

  const { mutateAsync: updateNominationSessionAsync } = useUpdateNominationSessionMutation();
  const { mutate: validateSession } = useValidateSessionMutation();

  const onSubmit = async (data: {
    name: string;
    date: string;
    observationsClosingDate: string;
    dueDate: string | null;
    positionStartDate: string | null;
  }) => {
    await updateNominationSessionAsync(
      { sessionId: transparence.id, data },
      {
        onSuccess: () => {
          const alert = { severity: 'success', title: 'Données actualisée' } as const;
          if (transparence.isValidated || !user) {
            alerts.pushAlert(alert);
            return;
          }

          validateSession(
            { userId: user.id, sessionId: transparence.id },
            { onSettled: () => alerts.pushAlert(alert) }
          );
        },
        onError: () =>
          alerts.pushAlert({ severity: 'error', title: 'Erreur lors de la modification de la transparence' })
      }
    );
    toggleEdit();
  };

  return (
    <div className="fr-col flex flex-col gap-3">
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
