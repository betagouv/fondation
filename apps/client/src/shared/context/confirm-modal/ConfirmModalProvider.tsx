import Button from '@codegouvfr/react-dsfr/Button';
import { Fragment, useCallback, type PropsWithChildren } from 'react';
import { useIntl } from 'react-intl';

import { useAwaitableModal } from '@/shared/hooks/useAwaitableModal';
import { Modal } from '@/shared/ui/modal';

import { ConfirmModalContext, type ConfirmModalOptions } from './confirm-modal.context';

export function ConfirmModalProvider({ children }: PropsWithChildren) {
  const { formatMessage } = useIntl();
  const { answer, ask, forget, state } = useAwaitableModal<ConfirmModalOptions, boolean>(false);

  const cancel = useCallback(() => answer(false), [answer]);

  return (
    <ConfirmModalContext value={{ ask, cancel }}>
      {state.status !== 'idle' && (
        <Modal
          actions={
            <>
              <Button onClick={cancel} priority="secondary">
                {state.question.i18n?.cancel ?? formatMessage({ defaultMessage: 'Ne rien faire' })}
              </Button>
              <Button onClick={() => answer(true)}>
                {state.question.i18n?.confirm ?? formatMessage({ defaultMessage: 'Confirmer' })}
              </Button>
            </>
          }
          closeOnBackdrop={false}
          id="modal-confirm"
          onClose={cancel}
          onClosed={forget}
          open={state.status === 'asking'}
          title={state.question.title}
        >
          {/* a question replacing another one gets a fresh subtree, whatever state its content holds */}
          <Fragment key={state.id}>{state.question.content}</Fragment>
        </Modal>
      )}
      {children}
    </ConfirmModalContext>
  );
}
