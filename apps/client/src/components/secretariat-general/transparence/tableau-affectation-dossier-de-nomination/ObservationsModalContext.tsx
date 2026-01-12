import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import { type Observation } from '@queries/observations.queries';
import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type PropsWithChildren
} from 'react';
import { ObservationForm } from '../observations/ObservationForm';
import { ObservationsList } from '../observations/ObservationsList';

type ActiveFile = { id: string; name: string } | null;
type ModalMode = 'view' | 'create' | 'edit';

type ObservationsModalContextType = {
  open: (file: { id: string; name: string }, mode?: ModalMode) => void;
};

const ObservationsModalContext = createContext<ObservationsModalContextType | null>(null);

const modalObservations = createModal({
  id: 'modal-observations',
  isOpenedByDefault: false
});

export const ObservationsModalProvider: FC<PropsWithChildren> = ({ children }) => {
  const [activeFile, setActiveFile] = useState<ActiveFile>(null);
  const [modalMode, setModalMode] = useState<ModalMode>('view');
  const [editingObservation, setEditingObservation] = useState<Observation | null>(null);
  const modalRef = useRef<HTMLDialogElement | null>(null);

  const isOpen = useIsModalOpen(modalObservations, {
    onConceal() {
      setModalMode('view');
      setEditingObservation(null);
      setActiveFile(null);
    }
  });

  useLayoutEffect(() => {
    if (activeFile && !isOpen) {
      // Bug in @codegouvfr/react-dsfr implementation for the modal
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const modalExists = Boolean(modalRef.current && (window as any).dsfr(modalRef.current)?.modal);
      if (modalExists) {
        modalObservations.open();
      }
    }
  }, [activeFile, isOpen]);

  const open = (file: { id: string; name: string }, mode: ModalMode = 'view') => {
    setModalMode(mode);
    setActiveFile(file);
  };

  const handleEdit = (observation: Observation) => {
    setEditingObservation(observation);
    setModalMode('edit');
  };

  const handleBackToView = () => {
    setModalMode('view');
    setEditingObservation(null);
  };

  const handleSuccess = () => {
    setModalMode('view');
    setEditingObservation(null);
  };

  const title = useMemo(() => {
    if (!activeFile) return '';
    if (modalMode === 'view') return `Observations - ${activeFile.name}`;
    if (modalMode === 'create') return `Nouvelle observation - ${activeFile.name}`;
    return `Éditer l'observation - ${activeFile.name}`;
  }, [modalMode, activeFile]);

  const modalProps = { ref: modalRef };

  return (
    <ObservationsModalContext.Provider value={{ open }}>
      {children}

      <modalObservations.Component
        {...modalProps}
        title={title}
        size="large"
        concealingBackdrop={false}
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
                  children: 'Fermer'
                }
              ]
            : modalMode === 'create'
              ? [
                  {
                    doClosesModal: true,
                    priority: 'secondary' as const,
                    children: 'Annuler'
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
              : [
                  {
                    doClosesModal: false,
                    priority: 'secondary' as const,
                    children: 'Retour',
                    onClick: handleBackToView
                  },
                  {
                    doClosesModal: false,
                    priority: 'primary' as const,
                    children: 'Enregistrer',
                    nativeButtonProps: {
                      type: 'submit',
                      form: 'observation-form'
                    }
                  }
                ]
        }
      >
        {activeFile &&
          (modalMode === 'view' ? (
            <ObservationsList nominationFileId={activeFile.id} onEdit={handleEdit} />
          ) : (
            <ObservationForm
              nominationFileId={activeFile.id}
              nominationFileName={activeFile.name}
              observation={editingObservation ?? undefined}
              onSuccess={handleSuccess}
            />
          ))}
      </modalObservations.Component>
    </ObservationsModalContext.Provider>
  );
};

export function useObservationsModal() {
  const ctx = useContext(ObservationsModalContext);
  if (!ctx) throw new Error('useObservationsModal must be used within ObservationsModalProvider');
  return ctx;
}
