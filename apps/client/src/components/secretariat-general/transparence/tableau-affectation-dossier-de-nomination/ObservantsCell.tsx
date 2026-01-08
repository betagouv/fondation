import Button from '@codegouvfr/react-dsfr/Button';
import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { type FC, useState, useMemo, useMemo as useMemoModal } from 'react';
import { ObservationsList } from '../observations/ObservationsList';
import { ObservationForm } from '../observations/ObservationForm';
import { useObservationsQuery } from '@queries/observations.queries';

export const ObservantsCell: FC<{
  nominationFileId: string;
  nominationFileName: string;
  observants: string[] | null;
  observationCount: number;
  onAddObservation: (nominationFileId: string, nominationFileName: string) => void;
  readOnly?: boolean;
}> = ({ nominationFileId, nominationFileName, observants, observationCount, readOnly = false }) => {
  const observationsModal = useMemoModal(
    () =>
      createModal({
        id: `modal-observations-${nominationFileId}`,
        isOpenedByDefault: false
      }),
    [nominationFileId]
  );

  const [modalMode, setModalMode] = useState<'view' | 'create'>('view');

  const { data } = useObservationsQuery(nominationFileId);

  const openModal = (mode: 'view' | 'create') => {
    setModalMode(mode);
    observationsModal.open();
  };

  const handleModalClose = () => {
    setModalMode('view');
  };

  const observationMagistrats = useMemo(() => {
    const observations = data?.observations ?? [];
    const uniqueMagistrats = new Map<string, { firstName: string; lastName: string }>();

    observations.forEach((obs) => {
      if (obs.magistrat) {
        uniqueMagistrats.set(obs.magistrat.id, {
          firstName: obs.magistrat.firstName,
          lastName: obs.magistrat.lastName
        });
      }
    });

    return Array.from(uniqueMagistrats.values());
  }, [data?.observations]);

  return (
    <>
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
              <Button
                size="small"
                priority="secondary"
                iconId="ri-add-line"
                onClick={() => openModal('create')}
              >
                Ajouter
              </Button>
            ) : (
              <Button size="small" priority="tertiary" iconId="ri-eye-line" onClick={() => openModal('view')}>
                Voir ({observationCount})
              </Button>
            )}
          </div>
        )}
      </div>

      {!readOnly && (
        <observationsModal.Component
          title={
            modalMode === 'view'
              ? `Observations - ${nominationFileName}`
              : `Nouvelle observation - ${nominationFileName}`
          }
          size="large"
          buttons={
            modalMode === 'view'
              ? [
                  {
                    children: 'Ajouter',
                    priority: 'secondary' as const,
                    onClick: () => setModalMode('create'),
                    doClosesModal: false
                  },
                  {
                    doClosesModal: true,
                    children: 'Fermer',
                    onClick: handleModalClose
                  }
                ]
              : [
                  {
                    doClosesModal: true,
                    priority: 'secondary' as const,
                    children: 'Annuler',
                    onClick: handleModalClose
                  },
                  {
                    doClosesModal: false,
                    priority: 'primary' as const,
                    children: 'Créer',
                    nativeButtonProps: {
                      type: 'submit',
                      form: 'observation-form'
                    }
                  }
                ]
          }
        >
          {modalMode === 'view' ? (
            <ObservationsList nominationFileId={nominationFileId} />
          ) : (
            <ObservationForm
              nominationFileId={nominationFileId}
              nominationFileName={nominationFileName}
              onSuccess={() => {
                setModalMode('view');
              }}
            />
          )}
        </observationsModal.Component>
      )}
    </>
  );
};
