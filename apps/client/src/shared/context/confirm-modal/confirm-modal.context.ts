import { createContext, useCallback, useContext, type ReactNode } from 'react';

export type ConfirmModalOptions = {
  content?: ReactNode;
  i18n?: { cancel?: string; confirm?: string };
  title: string;
};

/** @internal */
export const ConfirmModalContext = createContext<{
  ask: (options: ConfirmModalOptions) => Promise<boolean>;
  cancel: () => void;
} | null>(null);

export function useConfirmModal() {
  const context = useContext(ConfirmModalContext);
  if (!context) throw new Error('useConfirmModal must be used within a ConfirmModalProvider');
  const { ask } = context;

  const waitForConfirmation = useCallback(
    (options: ConfirmModalOptions): Promise<{ isConfirmed: boolean }> =>
      ask(options).then((isConfirmed) => ({ isConfirmed })),
    [ask],
  );

  return { cancel: context.cancel, waitForConfirmation };
}
