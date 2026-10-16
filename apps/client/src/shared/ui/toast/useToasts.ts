import { Toast as BaseToast } from '@base-ui/react/toast';
import { useMemo } from 'react';

const MIN_TIMEOUT_MS = 5_000;
const MAX_TIMEOUT_MS = 10_000;
const MS_PER_CHARACTER = 60;

export type ToastNotice = {
  action?: { label: string; onClick: () => void };
  description?: string;
  title: string;
};

function readingTimeMs(notice: ToastNotice): number {
  const characters = notice.title.length + (notice.description?.length ?? 0);
  return Math.min(MAX_TIMEOUT_MS, Math.max(MIN_TIMEOUT_MS, characters * MS_PER_CHARACTER));
}

function optionsOf(notice: ToastNotice) {
  return {
    actionProps: notice.action && { children: notice.action.label, onClick: notice.action.onClick },
    description: notice.description,
    title: notice.title,
  };
}

export function useToasts() {
  // the manager changes with every toast shown, its methods never: an effect depending on these toasts would loop
  const { add, close } = BaseToast.useToastManager();

  return useMemo(
    () => ({
      close: (toastId: string) => close(toastId),

      error: (notice: ToastNotice & { id?: string }) =>
        add({ ...optionsOf(notice), id: notice.id, priority: 'low', timeout: 0, type: 'error' }),

      success: (notice: ToastNotice) =>
        add({
          ...optionsOf(notice),
          priority: 'low',
          timeout: notice.action ? MAX_TIMEOUT_MS : readingTimeMs(notice),
          type: 'success',
        }),
    }),
    [add, close],
  );
}
