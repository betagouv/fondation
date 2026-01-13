import Button from '@codegouvfr/react-dsfr/Button';
import { type FC } from 'react';

import {
  useObservationsQuery,
  useGetObservationFileUrlMutation,
  type Observation
} from '@queries/observations.queries';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
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
      { onSuccess: (url) => window.open(url, '_blank') }
    );
  };

  return (
    <div className="rounded border bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <div className="text-sm text-gray-500">Reçue le {formatDate(observation.dateReception)}</div>
          {observation.magistrat && (
            <div className="font-medium">
              Observant: {observation.magistrat.lastName} {observation.magistrat.firstName}
            </div>
          )}
        </div>
        <div className="flex gap-1">
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
          <div className="mb-2 text-sm font-medium">Pièces jointes:</div>
          <div className="flex flex-wrap gap-2">
            {observation.files.map((file) => (
              <button
                key={file.id}
                type="button"
                disabled={isLoadingFile}
                onClick={() => handleFileClick(file.id)}
                className="flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-sm hover:bg-gray-200 disabled:opacity-50"
              >
                <i className="ri-file-line" />
                {file.name}
              </button>
            ))}
          </div>
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
        <div className="rounded bg-gray-50 p-4 text-center text-gray-500">
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
