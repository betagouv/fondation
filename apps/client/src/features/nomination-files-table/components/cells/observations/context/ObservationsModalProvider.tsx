import Button from '@codegouvfr/react-dsfr/Button';
import { useCallback, useMemo, useReducer, useState, type PropsWithChildren } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { ObservationForm } from '../ObservationForm';
import { ObservationsList } from '../ObservationsList';
import { useConfirmModal } from '@/shared/context/confirm-modal';
import { Modal } from '@/shared/ui/modal';
import { dateOnlyFromIso, formatDateOnly } from '@/utils/date-only.util';
import { useDeleteObservationMutation, type Observation } from '@queries/observations.queries';

import { ObservationsModalContext, type ActiveFile } from './ObservationsModalContext';

export type ModalState =
  | { status: 'closed' }
  | { status: 'view'; file: ActiveFile }
  | { status: 'create'; file: ActiveFile; standalone: boolean }
  | { status: 'edit'; file: ActiveFile; observation: Observation; standalone: boolean };

export type ModalAction =
  | { type: 'open'; file: ActiveFile; mode: 'view' | 'create' }
  | { type: 'goCreate' }
  | { type: 'edit'; observation: Observation; file?: ActiveFile }
  | { type: 'exit' }
  | { type: 'close' };

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
    case 'exit':
      return leave(state);
    case 'close':
      return { status: 'closed' };
  }
}

export function ObservationsModalProvider({ children }: PropsWithChildren) {
  const intl = useIntl();
  const [state, dispatch] = useReducer(modalReducer, { status: 'closed' });
  const [form, setForm] = useState({ isDirty: false, isValid: false });
  const [isPending, setIsPending] = useState(false);
  const { mutate: deleteObservation } = useDeleteObservationMutation();
  const { waitForConfirmation } = useConfirmModal();

  const transition = useCallback((action: ModalAction) => {
    setForm({ isDirty: false, isValid: false });
    setIsPending(false);
    dispatch(action);
  }, []);

  const requestLeave = useCallback(
    async (action: ModalAction) => {
      if (form.isDirty) {
        const { isConfirmed } = await waitForConfirmation({
          content: (
            <p>
              <FormattedMessage defaultMessage="Les informations saisies seront perdues." />
            </p>
          ),
          i18n: {
            cancel: intl.formatMessage({ defaultMessage: 'Continuer la saisie' }),
            confirm: intl.formatMessage({ defaultMessage: 'Abandonner' }),
          },
          title: intl.formatMessage({ defaultMessage: 'Abandonner la saisie' }),
        });

        if (!isConfirmed) return;
      }

      transition(action);
    },
    [form.isDirty, intl, transition, waitForConfirmation],
  );

  const requestDelete = useCallback(
    async (observation: Observation, file: ActiveFile) => {
      const { isConfirmed } = await waitForConfirmation({
        content: (
          <p>
            <FormattedMessage
              defaultMessage="Êtes-vous sûr de vouloir supprimer cette observation du <b>{date}</b> ?"
              values={{
                b: (chunks) => <strong>{chunks}</strong>,
                date: formatDateOnly(dateOnlyFromIso(observation.dateReception)),
              }}
            />
          </p>
        ),
        i18n: { confirm: intl.formatMessage({ defaultMessage: 'Supprimer' }) },
        title: intl.formatMessage({ defaultMessage: "Supprimer l'observation" }),
      });

      if (!isConfirmed) return;

      deleteObservation({
        sessionId: file.sessionId,
        nominationFileId: file.id,
        observationId: observation.id,
      });
    },
    [deleteObservation, intl, waitForConfirmation],
  );

  const value = useMemo(
    () => ({
      edit: (observation: Observation, file: ActiveFile) => transition({ type: 'edit', observation, file }),
      open: (file: ActiveFile, mode: 'view' | 'create' = 'view') => transition({ type: 'open', file, mode }),
      requestDelete,
    }),
    [requestDelete, transition],
  );

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
      case 'edit':
        return intl.formatMessage(
          { defaultMessage: "Éditer l'observation - {name}" },
          { name: state.file.name },
        );
    }
  })();

  const actions = (() => {
    switch (state.status) {
      case 'closed':
      case 'view':
        return undefined;
      case 'create':
        return (
          <>
            <Button disabled={isPending} onClick={() => requestLeave({ type: 'close' })} priority="secondary">
              <FormattedMessage defaultMessage="Annuler" />
            </Button>
            <Button
              disabled={isPending || !form.isValid}
              nativeButtonProps={{ form: 'observation-form', type: 'submit' }}
            >
              <FormattedMessage defaultMessage="Créer" />
            </Button>
          </>
        );
      case 'edit':
        return (
          <>
            <Button disabled={isPending} onClick={() => requestLeave({ type: 'exit' })} priority="secondary">
              <FormattedMessage defaultMessage="Retour" />
            </Button>
            <Button
              disabled={isPending || !form.isValid || !form.isDirty}
              nativeButtonProps={{ form: 'observation-form', type: 'submit' }}
            >
              <FormattedMessage defaultMessage="Enregistrer" />
            </Button>
          </>
        );
    }
  })();

  return (
    <ObservationsModalContext value={value}>
      {children}

      <Modal
        actions={actions}
        id="modal-observations"
        onClose={() => requestLeave({ type: 'close' })}
        open={state.status !== 'closed'}
        size="large"
        title={title}
      >
        {state.status === 'view' ? (
          <ObservationsList
            nominationFileId={state.file.id}
            onAdd={() => transition({ type: 'goCreate' })}
            onEdit={(observation) => transition({ type: 'edit', observation })}
            onRequestDelete={(observation) => requestDelete(observation, state.file)}
            sessionId={state.file.sessionId}
          />
        ) : state.status === 'closed' ? null : (
          <ObservationForm
            nominationFileId={state.file.id}
            observation={state.status === 'edit' ? state.observation : undefined}
            onFormStateChange={setForm}
            onPending={setIsPending}
            onSuccess={() => transition({ type: 'exit' })}
            sessionId={state.file.sessionId}
          />
        )}
      </Modal>
    </ObservationsModalContext>
  );
}
