import Button from '@codegouvfr/react-dsfr/Button';
import { type FC } from 'react';

import { useConfirmation } from '../../../../hooks/useConfirmation.hook';
import {
  useObservationsQuery,
  useDeleteObservationMutation,
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
  observation: Observation;
  nominationFileId: string;
  onDelete: () => void;
}> = ({ observation, nominationFileId, onDelete }) => {
  const { mutate: deleteObservation, isPending } = useDeleteObservationMutation();
  const { waitForConfirmation } = useConfirmation();

  const handleDelete = async () => {
    const { isConfirmed } = await waitForConfirmation({
      title: "Supprimer l'observation",
      content: (
        <p>
          Êtes-vous sûr de vouloir supprimer cette observation du{' '}
          <strong>{formatDate(observation.dateReception)}</strong> ?
        </p>
      ),
      i18n: {
        confirm: 'Supprimer',
        cancel: 'Annuler'
      }
    });

    if (!isConfirmed) return;

    deleteObservation({ observationId: observation.id, nominationFileId }, { onSuccess: onDelete });
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
        <Button
          iconId="ri-delete-bin-line"
          priority="tertiary no outline"
          size="small"
          title="Supprimer"
          disabled={isPending}
          onClick={handleDelete}
        />
      </div>

      {observation.files.length > 0 && (
        <div className="mt-3 border-t pt-3">
          <div className="mb-2 text-sm font-medium">Pièces jointes:</div>
          <div className="flex flex-wrap gap-2">
            {observation.files.map((file) => (
              <a
                key={file.id}
                href={file.signedUrl ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-sm hover:bg-gray-200 ${
                  !file.signedUrl ? 'pointer-events-none opacity-50' : ''
                }`}
              >
                <i className="ri-file-line" />
                {file.name}
              </a>
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
  nominationFileId: string;
}> = ({ nominationFileId }) => {
  const { data, isLoading, refetch } = useObservationsQuery(nominationFileId);

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
              key={observation.id}
              observation={observation}
              nominationFileId={nominationFileId}
              onDelete={() => refetch()}
            />
          ))}
        </div>
      )}
    </div>
  );
};
