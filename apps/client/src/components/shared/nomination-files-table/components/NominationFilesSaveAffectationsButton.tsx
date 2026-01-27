import Button from '@codegouvfr/react-dsfr/Button';
import React from 'react';

import { HttpException } from '@/utils/http-exception';
import { useAffectNominationFilesReportersMutation } from '@queries/nomination-sessions.queries';
import { useAlerts } from '@/components/shared/alerts/alerts.context';
import { useNominationFilesTable } from '../contexts/files-table.context';
import { useAffectations } from '../contexts/files-affectations.context';

export function NominationFilesSaveAffectationsButton() {
  const alerts = useAlerts();
  const { sessionId, isEditable, edition } = useNominationFilesTable();
  const { getAffectations, resetAffectations, hasChanges } = useAffectations();
  const { mutate: saveAffectations, isPending } = useAffectNominationFilesReportersMutation();

  const handleSave = React.useCallback(() => {
    if (!isEditable || !hasChanges) return;

    saveAffectations(
      {
        sessionId,
        affectations: getAffectations().map(({ reporterIds, priority, id }) => ({
          priority,
          reporterIds,
          nominationFileId: id
        }))
      },
      {
        onSuccess: () => alerts.pushAlert({ severity: 'success', title: 'Succès: données actualisées' }),
        onSettled: () => {
          resetAffectations();
          edition?.setEditing(false);
        },
        onError: async (err) => {
          let description: React.ReactNode | undefined;
          if (err instanceof HttpException) {
            const { validationErrors } = (await err.response.json()) as { validationErrors: string[] };

            description =
              validationErrors.length > 1 ? (
                <ul>
                  {validationErrors.map((e, i) => (
                    <li key={`key_${i}`}>{e}</li>
                  ))}
                </ul>
              ) : (
                validationErrors[0]
              );
          }

          alerts.pushAlert({
            severity: 'error',
            title: `Erreur pendant la mise à jour des affectation`,
            description
          });
        }
      }
    );
  }, [
    alerts,
    sessionId,
    isEditable,
    hasChanges,
    edition,
    getAffectations,
    saveAffectations,
    resetAffectations
  ]);

  return (
    <Button
      priority="primary"
      iconId="fr-icon-save-line"
      title="Sauvegarder les affectations"
      disabled={!isEditable || !hasChanges || isPending}
      onClick={handleSave}
    >
      Sauvegarder
    </Button>
  );
}
