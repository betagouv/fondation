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
    <div className="rounded-sm border bg-white p-4 shadow-xs">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <div className="text-sm text-gray-500">Reçue le {formatDate(observation.dateReception)}</div>
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
        <div className="mt-3 border-t pt-3">
          <div className="fr-mb-1w fr-text--sm fr-text--bold">Pièces jointes:</div>
          <ul className="fr-raw-list">
            {observation.files.map((file) => (
              <li key={file.id} className="fr-mb-1w">
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
        <div className="mt-3 text-xs text-gray-400">
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
    <div className="mt-6">
      <div className="mb-4">
        <label className="text-xl font-semibold">Observations ({observations.length})</label>
      </div>

      {isLoading ? (
        <div className="text-gray-500">Chargement...</div>
      ) : observations.length === 0 ? (
        <div className="rounded-sm bg-gray-50 p-4 text-center text-gray-500">
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
