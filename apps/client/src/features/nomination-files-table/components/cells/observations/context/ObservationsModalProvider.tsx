import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import {
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type FC,
  type PropsWithChildren,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { ObservationForm } from '../ObservationForm';
import { ObservationsList } from '../ObservationsList';
import { useDeleteObservationMutation, type Observation } from '@queries/observations.queries';

import { ObservationsModalContext, type ActiveFile } from './ObservationsModalContext';

export type ModalState =
  | { status: 'closed' }
  | { status: 'view'; file: ActiveFile }
  | { status: 'create'; file: ActiveFile; standalone: boolean }
  | { status: 'edit'; file: ActiveFile; observation: Observation; standalone: boolean }
  | { status: 'confirm-delete'; file: ActiveFile; observation: Observation; standalone: boolean };

export type ModalAction =
  | { type: 'open'; file: ActiveFile; mode: 'view' | 'create' }
  | { type: 'goCreate' }
  | { type: 'edit'; observation: Observation; file?: ActiveFile }
  | { type: 'requestDelete'; observation: Observation; file?: ActiveFile }
  | { type: 'exit' }
  | { type: 'conceal' };

// A standalone action was opened directly bypassing the list: leaving it closes the modal
const leave = (state: ModalState): ModalState =>
  'standalone' in state && !state.standalone ? { status: 'view', file: state.file } : { status: 'closed' };

export function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case 'open':
      return action.mode === 'create'
        ? { status: 'create', file: action.file, standalone: true }
        : { status: 'view', file: action.file };
    case 'goCreate':
      return 'file' in state ? { status: 'create', file: state.file, standalone: false } : state;
    case 'edit': {
      const file = action.file ?? ('file' in state ? state.file : null);
      if (!file) return state;
      return { status: 'edit', file, observation: action.observation, standalone: Boolean(action.file) };
    }
    case 'requestDelete': {
      const file = action.file ?? ('file' in state ? state.file : null);
      if (!file) return state;
      return {
        status: 'confirm-delete',
        file,
        observation: action.observation,
        standalone: Boolean(action.file),
      };
    }
    case 'exit':
      return leave(state);
    case 'conceal':
      return { status: 'closed' };
  }
}

const modalObservations = createModal({
  id: 'modal-observations',
  isOpenedByDefault: false,
});

export const ObservationsModalProvider: FC<PropsWithChildren> = ({ children }) => {
  const intl = useIntl();
  const [state, dispatch] = useReducer(modalReducer, { status: 'closed' });
  const modalRef = useRef<HTMLDialogElement | null>(null);
  const [isPending, setIsPending] = useState<boolean>(false);
  const { mutate: deleteObservation, isPending: isDeleting } = useDeleteObservationMutation();

  const isOpen = useIsModalOpen(modalObservations, {
    onConceal: () => dispatch({ type: 'conceal' }),
  });

  const shouldBeOpen = state.status !== 'closed';
  useLayoutEffect(() => {
    if (shouldBeOpen && !isOpen) {
      // Bug in @codegouvfr/react-dsfr implementation for the modal
      const modalExists = Boolean(
        // oxlint-disable-next-line @typescript-eslint/no-explicit-any
        modalRef.current && (window as any).dsfr(modalRef.current)?.modal,
      );
      if (modalExists) modalObservations.open();
    } else if (!shouldBeOpen && isOpen) {
      modalObservations.close();
    }
  }, [shouldBeOpen, isOpen]);

  const handleConfirmDelete = () => {
    if (state.status !== 'confirm-delete') return;
    const { file, observation } = state;
    deleteObservation(
      { sessionId: file.sessionId, nominationFileId: file.id, observationId: observation.id },
      { onSuccess: () => dispatch({ type: 'exit' }) },
    );
  };

  const title = (() => {
    switch (state.status) {
      case 'closed':
        return '';
      case 'view':
        return intl.formatMessage({ defaultMessage: 'Observations - {name}' }, { name: state.file.name });
      case 'create':
        return intl.formatMessage(
          { defaultMessage: 'Nouvelle observation - {name}' },
          { name: state.file.name },
        );
      case 'confirm-delete':
        return intl.formatMessage({ defaultMessage: "Supprimer l'observation" });
      case 'edit':
        return intl.formatMessage(
          { defaultMessage: "Éditer l'observation - {name}" },
          { name: state.file.name },
        );
    }
  })();

  const onPendingChange = useCallback((pending: boolean) => setIsPending(pending), []);

  const modalProps = { ref: modalRef };

  const value = useMemo(
    () => ({
      edit: (observation: Observation, file?: ActiveFile) => dispatch({ type: 'edit', observation, file }),
      open: (file: ActiveFile, mode: 'view' | 'create' = 'view') => dispatch({ type: 'open', file, mode }),
      requestDelete: (observation: Observation, file?: ActiveFile) =>
        dispatch({ type: 'requestDelete', observation, file }),
    }),
    [],
  );

  const mode = state.status === 'closed' ? 'view' : state.status;

  return (
    <ObservationsModalContext value={value}>
      {children}

      <modalObservations.Component
        {...modalProps}
        buttons={
          mode === 'view'
            ? [
                {
                  children: intl.formatMessage({ defaultMessage: 'Ajouter' }),
                  disabled: isPending,
                  doClosesModal: false,
                  onClick: () => dispatch({ type: 'goCreate' }),
                  priority: 'secondary' as const,
                },
                {
                  children: intl.formatMessage({ defaultMessage: 'Fermer' }),
                  doClosesModal: true,
                },
              ]
            : mode === 'create'
              ? [
                  {
                    children: intl.formatMessage({ defaultMessage: 'Annuler' }),
                    disabled: isPending,
                    doClosesModal: true,
                    priority: 'secondary' as const,
                  },
                  {
                    children: intl.formatMessage({ defaultMessage: 'Créer' }),
                    disabled: isPending,
                    doClosesModal: false,
                    nativeButtonProps: {
                      form: 'observation-form',
                      type: 'submit',
                    },
                    priority: 'primary' as const,
                  },
                ]
              : mode === 'confirm-delete'
                ? [
                    {
                      children: intl.formatMessage({ defaultMessage: 'Annuler' }),
                      disabled: isPending,
                      doClosesModal: false,
                      onClick: () => dispatch({ type: 'exit' }),
                      priority: 'secondary' as const,
                    },
                    {
                      children: intl.formatMessage({ defaultMessage: 'Supprimer' }),
                      disabled: isPending,
                      doClosesModal: false,
                      nativeButtonProps: {
                        disabled: isDeleting,
                      },
                      onClick: handleConfirmDelete,
                      priority: 'primary' as const,
                    },
                  ]
                : [
                    {
                      children: intl.formatMessage({ defaultMessage: 'Retour' }),
                      disabled: isPending,
                      doClosesModal: false,
                      onClick: () => dispatch({ type: 'exit' }),
                      priority: 'secondary' as const,
                    },
                    {
                      children: intl.formatMessage({ defaultMessage: 'Enregistrer' }),
                      disabled: isPending,
                      doClosesModal: false,
                      nativeButtonProps: {
                        form: 'observation-form',
                        type: 'submit',
                      },
                      priority: 'primary' as const,
                    },
                  ]
        }
        concealingBackdrop={false}
        size="large"
        title={title}
      >
        {state.status !== 'closed' &&
          (state.status === 'view' ? (
            <ObservationsList
              nominationFileId={state.file.id}
              onEdit={(observation) => dispatch({ type: 'edit', observation })}
              onRequestDelete={(observation) => dispatch({ type: 'requestDelete', observation })}
              sessionId={state.file.sessionId}
            />
          ) : state.status === 'confirm-delete' ? (
            <p>
              <FormattedMessage
                defaultMessage="Êtes-vous sûr de vouloir supprimer cette observation du <b>{date, date, dateOnlyShort}</b> ?"
                values={{
                  b: (chunks) => <strong>{chunks}</strong>,
                  date: new Date(state.observation.dateReception),
                }}
              />
            </p>
          ) : (
            <ObservationForm
              nominationFileId={state.file.id}
              observation={state.status === 'edit' ? state.observation : undefined}
              onPending={onPendingChange}
              onSuccess={() => dispatch({ type: 'exit' })}
              sessionId={state.file.sessionId}
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
