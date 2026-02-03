import Button from '@codegouvfr/react-dsfr/Button';
import { type FC } from 'react';

import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { useNominationFilesTable } from '@/components/shared/nomination-files-table/contexts/files-table.context';
import { ObservationLinks } from '@/components/shared/ObservationLinks';
import { useIsSgNavigation } from '@/hooks/roles.hook';
import { useObservationsModal } from './ObservationsModalContext';

type ObservantsCellProps = {
  nominationFile: SessionNominationFile;
};

export const ObservantsCell: FC<ObservantsCellProps> = ({ nominationFile }) => {
  const isSg = useIsSgNavigation();
  const { sessionId, edition } = useNominationFilesTable();

  const id = nominationFile.id;
  const nominationFileName = nominationFile.content.nomMagistrat;
  const observants = nominationFile.content.observants;
  const observationCount = nominationFile.observationCount;
  const observationMagistrats = nominationFile.observationMagistrats;

  const { open } = useObservationsModal();

  const handleAdd = () => open({ id, sessionId, name: nominationFileName }, 'create');
  const handleView = () => open({ id, sessionId, name: nominationFileName }, 'view');

  if (edition?.isEditing) {
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
    <ObservationLinks
      sessionId={sessionId}
      nominationFileId={id}
      observations={observationMagistrats}
      lodamObservants={observants}
      context={isSg ? 'sg' : 'membre'}
    />
  );
};
