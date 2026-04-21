import Button from '@codegouvfr/react-dsfr/Button';
import React from 'react';

import { useAlerts } from '@/components/shared/alerts/alerts.context';
import { HttpException } from '@/utils/http-exception';
import { useAffectNominationFilesReportersMutation } from '@queries/nomination-sessions.queries';
import { useAffectations } from '../contexts/files-affectations.context';
import { useNominationFilesTable } from '../contexts/files-table.context';

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
        affectations: getAffectations().map(({ reporterIds, priorities, id }) => ({
          reporterIds,
          nominationFileId: id,
          priorities: priorities
        }))
      },
      {
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
      size="small"
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
