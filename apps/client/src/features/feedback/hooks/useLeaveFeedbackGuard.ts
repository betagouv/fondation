import { useEffect, useRef } from 'react';
import { useIntl } from 'react-intl';
import { useBlocker } from 'react-router';

import { useConfirmModal } from '@/shared/context/confirm-modal';

// TODO: see useUnsavedChangesGuard
/** a questionnaire is never saved half-way: leaving it once started loses the answers */
export function useLeaveFeedbackGuard(isStarted: boolean) {
  const { formatMessage } = useIntl();
  const { waitForConfirmation } = useConfirmModal();
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => isStarted && currentLocation.pathname !== nextLocation.pathname,
  );
  // every render while the question is open runs the effect again: without this, it is asked twice
  const isAsking = useRef(false);

  useEffect(() => {
    if (blocker.state !== 'blocked' || isAsking.current) return;
    isAsking.current = true;

    void waitForConfirmation({
      content: formatMessage({
        defaultMessage:
          "Votre avis n'a pas encore été envoyé. Si vous quittez cette page, les réponses déjà saisies seront perdues.",
      }),
      i18n: {
        cancel: formatMessage({ defaultMessage: 'Continuer le questionnaire' }),
        confirm: formatMessage({ defaultMessage: 'Quitter' }),
      },
      title: formatMessage({ defaultMessage: 'Quitter le questionnaire ?' }),
    }).then(({ isConfirmed }) => {
      isAsking.current = false;
      if (isConfirmed) blocker.proceed?.();
      else blocker.reset?.();
    });
  }, [blocker, formatMessage, waitForConfirmation]);

  useEffect(() => {
    if (!isStarted) return;

    const warnBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [isStarted]);
}
