import Button from '@codegouvfr/react-dsfr/Button';
import { type FC } from 'react';

import { getObservationDetailsPath } from '@/utils/route-path.utils';
import { toFullName } from '@/utils/user.utils';
import {
  useGetObservationFileUrlMutation,
  useObservationsQuery,
  type Observation,
} from '@queries/observations.queries';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const ObservationCard: FC<{
  sessionId: string;
  nominationFileId: string;
  observation: Observation;
  onEdit: (observation: Observation) => void;
  onRequestDelete: (observation: Observation) => void;
}> = ({ sessionId, nominationFileId, observation, onEdit, onRequestDelete }) => {
  const { mutate: getFileUrl, isPending: isLoadingFile } = useGetObservationFileUrlMutation();

  const handleFileClick = (fileId: string) => {
    getFileUrl(
      { sessionId, nominationFileId, observationId: observation.id, fileId },
      { onSuccess: (url) => window.open(url, '_blank') },
    );
  };

  return (
    <div className="fr-p-4v rounded-sm border bg-(--background-default-grey) shadow-xs">
      <div className="fr-mb-2v flex items-start justify-between">
        <div>
          <div className="text-sm text-(--text-mention-grey)">
            Reçue le {formatDate(observation.dateReception)}
          </div>
          {observation.magistrat && (
            <div className="font-medium">
              Observant: {observation.magistrat.lastName} {observation.magistrat.firstName}
              {observation.magistrat.currentPosition && ` - ${observation.magistrat.currentPosition}`}
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            size="small"
            iconId="ri-file-text-line"
            priority="tertiary no outline"
            title={
              observation.magistrat
                ? `Voir le détail de l'observation par ${toFullName(observation.magistrat)}`
                : `Voir le détail de l'observation`
            }
            linkProps={{
              to: getObservationDetailsPath({
                sessionId,
                nominationFileId,
                observationId: observation.id,
                context: 'sg',
              }),
            }}
          />
          <Button
            iconId="ri-edit-line"
            priority="tertiary no outline"
            size="small"
            title="Éditer"
            onClick={() => onEdit(observation)}
          />
          <Button
            iconId="ri-delete-bin-line"
            priority="tertiary no outline"
            size="small"
            title="Supprimer"
            onClick={() => onRequestDelete(observation)}
          />
        </div>
      </div>

      {observation.files.length > 0 && (
        <div className="fr-mt-3v fr-pt-3v border-t">
          <div className="fr-mb-2v fr-text--sm fr-text--bold">Pièces jointes:</div>
          <ul className="fr-raw-list">
            {observation.files.map((file) => (
              <li key={file.id} className="fr-mb-2v">
                <Button
                  priority="tertiary no outline"
                  iconId="ri-file-download-line"
                  size="small"
                  disabled={isLoadingFile}
                  onClick={() => handleFileClick(file.id)}
                >
                  {file.name}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {observation.createdBy && (
        <div className="fr-mt-3v text-xs text-(--text-disabled-grey)">
          Créée par {observation.createdBy.lastName} {observation.createdBy.firstName} le{' '}
          {formatDate(observation.createdAt)}
        </div>
      )}
    </div>
  );
};

export const ObservationsList: FC<{
  sessionId: string;
  nominationFileId: string;
  onEdit: (observation: Observation) => void;
  onRequestDelete: (observation: Observation) => void;
}> = ({ sessionId, nominationFileId, onEdit, onRequestDelete }) => {
  const { data, isLoading } = useObservationsQuery({ sessionId, nominationFileId });

  const observations = data?.observations ?? [];

  return (
    <div className="fr-mt-6v">
      <div className="fr-mb-4v">
        <label className="text-xl font-semibold">Observations ({observations.length})</label>
      </div>

      {isLoading ? (
        <div className="text-(--text-mention-grey)">Chargement...</div>
      ) : observations.length === 0 ? (
        <div className="fr-p-4v rounded-sm bg-(--background-alt-grey) text-center text-(--text-mention-grey)">
          Aucune observation pour ce dossier
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {observations.map((observation) => (
            <ObservationCard
              sessionId={sessionId}
              nominationFileId={nominationFileId}
              key={observation.id}
              observation={observation}
              onEdit={onEdit}
              onRequestDelete={onRequestDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
