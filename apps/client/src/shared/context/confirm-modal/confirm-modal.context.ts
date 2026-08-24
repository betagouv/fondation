import { createContext, useContext, type ReactNode } from 'react';

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

  return {
    cancel: context.cancel,
    waitForConfirmation: (options: ConfirmModalOptions): Promise<{ isConfirmed: boolean }> =>
      context.ask(options).then((isConfirmed) => ({ isConfirmed })),
  };
}
