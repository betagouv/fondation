import Button from '@codegouvfr/react-dsfr/Button';
import { type FC } from 'react';
import { useObservationsModal } from './ObservationsModalContext';
import { ObservationLinks } from '../../../shared/ObservationLinks';

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

  const observationsWithId = observationMagistrats
    .filter((m): m is typeof m & { observationId: string } => !!m.observationId)
    .map((m) => ({
      id: m.id,
      firstName: m.firstName,
      lastName: m.lastName,
      observationId: m.observationId
    }));

  return (
    <ObservationLinks
      sessionId={sessionId}
      nominationFileId={id}
      observations={observationsWithId}
      lodamObservants={observants}
    />
  );
};
