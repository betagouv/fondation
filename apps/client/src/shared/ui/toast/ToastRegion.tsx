import { Toast as BaseToast } from '@base-ui/react/toast';
import type { PropsWithChildren } from 'react';
import { useIntl } from 'react-intl';

import { Toast } from './Toast';

const VISIBLE_TOASTS = 3;

function ToastRegion() {
  const { formatMessage } = useIntl();
  const { toasts } = BaseToast.useToastManager();

  return (
    <BaseToast.Portal>
      <BaseToast.Viewport
        aria-label={formatMessage({ defaultMessage: 'Notifications' })}
        className="fr-p-4v pointer-events-none fixed right-0 bottom-0 z-(--z-index-popover) flex w-[min(28rem,100vw)] flex-col gap-2 outline-hidden"
      >
        {toasts
          .filter((toast) => !toast.limited)
          .reverse()
          .map((toast) => (
            <Toast key={toast.id} toast={toast} />
          ))}
      </BaseToast.Viewport>
    </BaseToast.Portal>
  );
}

export function ToastProvider(props: PropsWithChildren) {
  return (
    <BaseToast.Provider limit={VISIBLE_TOASTS}>
      {props.children}
      <ToastRegion />
    </BaseToast.Provider>
  );
}
