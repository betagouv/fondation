import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import { createContext, useCallback, useContext, useState, type PropsWithChildren } from 'react';
import { ObservationForm } from './ObservationForm';

const observationModal = createModal({
  id: 'modal-observation-create',
  isOpenedByDefault: false
});

type ObservationModalContextType = {
  openObservation: (nominationFileId: string, nominationFileName: string) => void;
};

const ObservationModalContext = createContext<ObservationModalContextType | null>(null);

export function ObservationModalProvider(props: PropsWithChildren) {
  const [target, setTarget] = useState<{
    nominationFileId: string;
    nominationFileName: string;
  } | null>(null);

  useIsModalOpen(observationModal, {
    onConceal() {
      setTarget(null);
    }
  });

  const openObservation = useCallback((nominationFileId: string, nominationFileName: string) => {
    setTarget({ nominationFileId, nominationFileName });
    observationModal.open();
  }, []);

  const handleSuccess = useCallback(() => {
    observationModal.close();
    setTarget(null);
  }, []);

  return (
    <>
      <observationModal.Component
        title={target ? `Nouvelle observation - ${target.nominationFileName}` : 'Nouvelle observation'}
        buttons={[
          {
            doClosesModal: true,
            priority: 'secondary',
            children: 'Annuler'
          },
          {
            doClosesModal: false,
            priority: 'primary',
            children: 'Créer',
            nativeButtonProps: {
              type: 'submit',
              form: 'observation-form'
            }
          }
        ]}
      >
        {target && (
          <ObservationForm
            nominationFileId={target.nominationFileId}
            nominationFileName={target.nominationFileName}
            onSuccess={handleSuccess}
          />
        )}
      </observationModal.Component>

      <ObservationModalContext value={{ openObservation }}>{props.children}</ObservationModalContext>
    </>
  );
}

export function useObservationModal() {
  const ctx = useContext(ObservationModalContext);
  if (!ctx) {
    throw new Error('useObservationModal must be used within ObservationModalProvider');
  }
  return ctx;
}
