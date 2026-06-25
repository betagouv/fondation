import Button from '@codegouvfr/react-dsfr/Button';

import { useIsSgNavigation } from '@/features/auth/hooks/roles.hook';
import { useNominationFilesTable } from '@/features/nomination-files-table/context/files-table.context';
import { ObservationLinks } from '@/features/observations/components/ObservationLinks';
import type { SessionNominationFile } from '@queries/nomination-sessions.queries';

import { useObservationsModal } from './context/ObservationsModalContext';

export function ObservantsCell({ nominationFile }: { nominationFile: SessionNominationFile }) {
  const isSg = useIsSgNavigation();
  const { sessionId, edition } = useNominationFilesTable();

  const { open } = useObservationsModal();

  const handleAdd = () =>
    open({ id: nominationFile.id, sessionId, name: nominationFile.content.nomMagistrat }, 'create');
  const handleView = () =>
    open({ id: nominationFile.id, sessionId, name: nominationFile.content.nomMagistrat }, 'view');

  if (edition?.isEditing && nominationFile.content.isUpdatable) {
    return (
      <div className="flex flex-col gap-2">
        {nominationFile.content.observants?.length ? (
          <div className="text-sm">
            <span className="font-medium text-(--text-mention-grey)">LODAM: </span>
            <span>{nominationFile.content.observants.join(', ')}</span>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {nominationFile.observations.length === 0 ? (
            <Button size="small" priority="secondary" iconId="ri-add-line" onClick={handleAdd}>
              Ajouter
            </Button>
          ) : (
            <Button size="small" priority="tertiary" iconId="ri-eye-line" onClick={handleView}>
              Voir ({nominationFile.observations.length})
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <ObservationLinks
      sessionId={sessionId}
      context={isSg ? 'sg' : 'membre'}
      nominationFile={{
        ...nominationFile,
        legacyObservers: nominationFile.content.observants ?? [],
        name: nominationFile.content.nomMagistrat,
      }}
    />
  );
}
