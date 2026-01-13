import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import { useDeleteObservationMutation, type Observation } from '@queries/observations.queries';
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

type ActiveFile = { sessionId: string; id: string; name: string };
type ModalMode = 'view' | 'create' | 'edit' | 'confirm-delete';

type ObservationsModalContextType = {
  open: (file: ActiveFile, mode?: ModalMode) => void;
  requestDelete: (observation: Observation) => void;
};

const ObservationsModalContext = createContext<ObservationsModalContextType | null>(null);

const modalObservations = createModal({
  id: 'modal-observations',
  isOpenedByDefault: false
});

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const ObservationsModalProvider: FC<PropsWithChildren> = ({ children }) => {
  const [activeFile, setActiveFile] = useState<ActiveFile | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>('view');
  const [editingObservation, setEditingObservation] = useState<Observation | null>(null);
  const [deletingObservation, setDeletingObservation] = useState<Observation | null>(null);
  const modalRef = useRef<HTMLDialogElement | null>(null);
  const { mutate: deleteObservation, isPending: isDeleting } = useDeleteObservationMutation();

  const isOpen = useIsModalOpen(modalObservations, {
    onConceal() {
      setModalMode('view');
      setEditingObservation(null);
      setDeletingObservation(null);
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

  const open = (file: { sessionId: string; id: string; name: string }, mode: ModalMode = 'view') => {
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

  const requestDelete = (observation: Observation) => {
    setDeletingObservation(observation);
    setModalMode('confirm-delete');
  };

  const handleConfirmDelete = () => {
    if (!deletingObservation || !activeFile) return;
    deleteObservation(
      {
        sessionId: activeFile.sessionId,
        nominationFileId: activeFile.id,
        observationId: deletingObservation.id
      },
      {
        onSuccess: () => {
          setDeletingObservation(null);
          setModalMode('view');
        }
      }
    );
  };

  const handleCancelDelete = () => {
    setDeletingObservation(null);
    setModalMode('view');
  };

  const title = useMemo(() => {
    if (!activeFile) return '';
    if (modalMode === 'view') return `Observations - ${activeFile.name}`;
    if (modalMode === 'create') return `Nouvelle observation - ${activeFile.name}`;
    if (modalMode === 'confirm-delete') return "Supprimer l'observation";
    return `Éditer l'observation - ${activeFile.name}`;
  }, [modalMode, activeFile]);

  const modalProps = { ref: modalRef };

  return (
    <ObservationsModalContext value={{ open, requestDelete }}>
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
              : modalMode === 'confirm-delete'
                ? [
                    {
                      doClosesModal: false,
                      priority: 'secondary' as const,
                      children: 'Annuler',
                      onClick: handleCancelDelete
                    },
                    {
                      doClosesModal: false,
                      priority: 'primary' as const,
                      children: 'Supprimer',
                      onClick: handleConfirmDelete,
                      nativeButtonProps: {
                        disabled: isDeleting
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
            <ObservationsList
              sessionId={activeFile.sessionId}
              nominationFileId={activeFile.id}
              onEdit={handleEdit}
              onRequestDelete={requestDelete}
            />
          ) : modalMode === 'confirm-delete' && deletingObservation ? (
            <p>
              Êtes-vous sûr de vouloir supprimer cette observation du{' '}
              <strong>{formatDate(deletingObservation.dateReception)}</strong> ?
            </p>
          ) : (
            <ObservationForm
              sessionId={activeFile.sessionId}
              nominationFileId={activeFile.id}
              nominationFileName={activeFile.name}
              observation={editingObservation ?? undefined}
              onSuccess={handleSuccess}
            />
          ))}
      </modalObservations.Component>
    </ObservationsModalContext>
  );
};

export function useObservationsModal() {
  const ctx = useContext(ObservationsModalContext);
  if (!ctx) throw new Error('useObservationsModal must be used within ObservationsModalProvider');
  return ctx;
}
