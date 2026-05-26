import { createModal } from '@codegouvfr/react-dsfr/Modal';
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
  type ReactNode,
} from 'react';

export const confirmationModal = createModal({
  isOpenedByDefault: false,
  id: `confirmation_modal`,
});

type ConfirmationOptions = {
  title?: string;
  content?: ReactNode;
  i18n?: { confirm?: string; cancel?: string };
};
type ConfirmationContextType = {
  open(options: ConfirmationOptions): Promise<boolean>;
};

type ConfirmationResponse = { isConfirmed: boolean };

const ConfirmationContext = createContext<ConfirmationContextType>(
  null as unknown as ConfirmationContextType,
);

export function ConfirmationProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<ConfirmationOptions>({});
  const [onClick, setOnClick] = useState<((value: boolean) => void) | null>(null);

  useIsModalOpen(confirmationModal, {
    onConceal() {
      onClick?.(false);

      setState({});
      setOnClick(null);
    },
  });

  useEffect(() => {
    if (onClick) {
      confirmationModal.open();
    }
  }, [onClick, state]);

  const open = useCallback(
    (options: ConfirmationOptions) =>
      new Promise<boolean>((resolve) => {
        setState(options);
        setOnClick(() => (value: boolean) => {
          resolve(value);
          setState({});
          setOnClick(null);
        });
      }),
    [setState, setOnClick],
  );

  return (
    <ConfirmationContext value={{ open }}>
      <confirmationModal.Component
        concealingBackdrop={false}
        title={state.title}
        buttons={[
          {
            doClosesModal: true,
            children: state.i18n?.cancel || 'Ne rien faire',
            priority: 'secondary',
            onClick: () => onClick?.(false),
          },
          {
            doClosesModal: true,
            children: state.i18n?.confirm || 'Confirmer',
            priority: 'primary',
            onClick: () => onClick?.(true),
          },
        ]}
      >
        {state.content}
      </confirmationModal.Component>

      {children}
    </ConfirmationContext>
  );
}

export function useConfirmation() {
  const ctx = useContext(ConfirmationContext);

  return {
    buttonProps: confirmationModal.buttonProps,
    waitForConfirmation: (options: ConfirmationOptions): Promise<ConfirmationResponse> =>
      ctx?.open(options).then((isConfirmed) => ({ isConfirmed })),
  };
}
