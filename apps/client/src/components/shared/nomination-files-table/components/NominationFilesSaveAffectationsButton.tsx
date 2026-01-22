import Button from '@codegouvfr/react-dsfr/Button';
import React from 'react';

import { useAffectation } from '@/contexts/AffectationDossiersContext';
import type { PrioriteEnum } from '@/types/enums.types';
import { HttpException } from '@/utils/http-exception';
import { useAffectNominationFilesReportersMutation } from '@queries/nomination-sessions.queries';
import { useAlerts } from '@/components/shared/alerts/alerts.context';
import { useNominationFilesTable } from './NominationFilesTableContext';

export function NominationFilesSaveAffectationsButton() {
  const alerts = useAlerts();
  const { sessionId, isEditable, edition } = useNominationFilesTable();
  const { getAllAffectations, resetAffectations, hasChanges } = useAffectation();
  const { mutate: saveAffectations, isPending } = useAffectNominationFilesReportersMutation();

  const handleSave = React.useCallback(() => {
    if (!isEditable) return;

    const affectations = getAllAffectations();

    saveAffectations(
      {
        sessionId,
        affectations: affectations.map((a) => ({
          reporterIds: a.rapporteurIds,
          nominationFileId: a.dossierId,
          priority: (a.priorite ?? null) as PrioriteEnum
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
  }, [alerts, sessionId, getAllAffectations, saveAffectations, isEditable, edition, resetAffectations]);

  return (
    <Button
      priority="primary"
      iconId="fr-icon-save-line"
      title="Sauvegarder les affectations"
      disabled={!hasChanges || isPending}
      onClick={handleSave}
    >
      Sauvegarder
    </Button>
  );
}
