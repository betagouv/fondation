import { useCallback, useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { useBlocker } from 'react-router';

import { useConfirmModal } from '@/shared/context/confirm-modal';

/**
 * holds back every way out of an edition screen while changes are not saved: the browser back,
 * the breadcrumb, the tab closing.
 *
 * @warning the flag is mirrored in a ref because saving then leaving happens in the same tick,
 * before React re-renders: a blocker reading the state would still see the stale one and hold on.
 */
export function useUnsavedChangesGuard(props: { onSave: () => Promise<void> }) {
  const { formatMessage } = useIntl();
  const { waitForConfirmation } = useConfirmModal();
  const { onSave } = props;

  const [isDirty, setIsDirty] = useState(false);
  const isDirtyRef = useRef(false);

  const setDirty = useCallback((dirty: boolean) => {
    isDirtyRef.current = dirty;
    setIsDirty(dirty);
  }, []);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirtyRef.current && currentLocation.pathname !== nextLocation.pathname,
  );

  const isAsking = useRef(false);

  useEffect(() => {
    if (blocker.state !== 'blocked' || isAsking.current) return;

    // saving rebuilds the screen while the departure is still held, and every render runs this
    // effect again: without this, each save asks the question once more
    isAsking.current = true;

    void (async () => {
      const { isConfirmed } = await waitForConfirmation({
        content: formatMessage({
          defaultMessage:
            "Vos modifications n'ont pas été enregistrées. Voulez-vous les enregistrer avant de quitter ?",
        }),
        i18n: {
          cancel: formatMessage({ defaultMessage: 'Quitter sans enregistrer' }),
          confirm: formatMessage({ defaultMessage: 'Enregistrer et quitter' }),
        },
        title: formatMessage({ defaultMessage: 'Modifications non enregistrées' }),
      });

      try {
        if (isConfirmed) await onSave();
      } catch {
        // a refused save cancels the departure, and leaving the blocker held would trap the
        // reader on the screen with no way out
        blocker.reset?.();
        return;
      } finally {
        isAsking.current = false;
      }

      blocker.proceed?.();
    })();
  }, [blocker, formatMessage, onSave, waitForConfirmation]);

  useEffect(() => {
    if (!isDirty) return;

    const warnBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', warnBeforeUnload);

    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [isDirty]);

  return { isDirty, setDirty };
}
