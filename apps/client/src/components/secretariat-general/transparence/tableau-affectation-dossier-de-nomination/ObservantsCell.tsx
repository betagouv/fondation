import Button from '@codegouvfr/react-dsfr/Button';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';
import { type FC } from 'react';
import { useObservationsModal } from './ObservationsModalContext';

type ObservantsCellProps = Pick<
  SessionNominationFile,
  'id' | 'observationCount' | 'observationMagistrats'
> & {
  nominationFileName: string;
  observants: string[] | null;
  readOnly?: boolean;
};

export const ObservantsCell: FC<ObservantsCellProps> = ({
  id,
  observants,
  observationCount,
  observationMagistrats,
  nominationFileName,
  readOnly = false
}) => {
  const { open } = useObservationsModal();

  const handleAdd = () => open({ id, name: nominationFileName }, 'create');
  const handleView = () => open({ id, name: nominationFileName }, 'view');

  return (
    <div className="flex flex-col gap-2">
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
            <span>{observationMagistrats.map((m) => `${m.lastName} ${m.firstName}`).join(', ')}</span>
          </div>
        )}

        {(!observants || observants.length === 0) && observationMagistrats.length === 0 && (
          <div className="text-sm text-gray-500">-</div>
        )}
      </div>

      {!readOnly && (
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
      )}
    </div>
  );
};
