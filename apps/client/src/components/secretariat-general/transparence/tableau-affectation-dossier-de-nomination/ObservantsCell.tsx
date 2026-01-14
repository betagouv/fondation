import Button from '@codegouvfr/react-dsfr/Button';
import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { useObservationsModal } from './ObservationsModalContext';

type ObservantsCellProps = {
  id: string;
  sessionId: string;
  nominationFileName: string;
  observants: string[] | null;
  readOnly?: boolean;
  observationMagistrats: { id: string; firstName: string; lastName: string; observationId?: string }[];
  observationCount: number;
};

export const ObservantsCell: FC<ObservantsCellProps> = ({
  id,
  sessionId,
  observants,
  observationCount,
  observationMagistrats,
  nominationFileName,
  readOnly = false
}) => {
  const { open } = useObservationsModal();

  const handleAdd = () => open({ id, sessionId, name: nominationFileName }, 'create');
  const handleView = () => open({ id, sessionId, name: nominationFileName }, 'view');

  if (!readOnly) {
    return (
      <div className="flex flex-col gap-2">
        {observants && observants.length > 0 && (
          <div className="text-sm">
            <span className="font-medium text-gray-600">LODAM: </span>
            <span>{observants.join(', ')}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {observationCount === 0 ? (
            <Button size="small" priority="secondary" iconId="ri-add-line" onClick={handleAdd}>
              Ajouter
            </Button>
          ) : (
            <Button size="small" priority="tertiary" iconId="ri-eye-line" onClick={handleView}>
              Voir ({observationCount})
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {observants && observants.length > 0 && (
        <div className="text-sm">
          <span className="font-medium text-gray-600">LODAM: </span>
          <span>{observants.join(', ')}</span>
        </div>
      )}

      {observationMagistrats.length > 0 && (
        <div className="text-sm">
          <span className="font-medium text-gray-600">Observations: </span>
          <span>
            {observationMagistrats.map((m, index) => (
              <span key={m.observationId ?? m.id}>
                {index > 0 && ', '}
                {m.observationId ? (
                  <Link
                    to={`/secretariat-general/session/${sessionId}/dossiers/${id}/observations/${m.observationId}`}
                    className="text-blue-600 hover:underline"
                  >
                    {m.lastName} {m.firstName}
                  </Link>
                ) : (
                  <span>{m.lastName} {m.firstName}</span>
                )}
              </span>
            ))}
          </span>
        </div>
      )}

      {(!observants || observants.length === 0) && observationMagistrats.length === 0 && (
        <div className="text-sm text-gray-500">-</div>
      )}
    </div>
  );
};
