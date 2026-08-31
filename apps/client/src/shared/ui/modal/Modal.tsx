import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

const FADE_DURATION_MS = 300;

const SIZE_CLASSES = { large: 'max-w-221', medium: 'max-w-166' } as const;

export function Modal(props: {
  actions?: ReactNode;
  children: ReactNode;
  closeOnBackdrop?: boolean;
  id?: string;
  onClose: () => void;
  /** the fade out is over: the caller can drop whatever it kept alive to render this modal */
  onClosed?: () => void;
  open: boolean;
  size?: keyof typeof SIZE_CLASSES;
  title: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isMounted, setIsMounted] = useState(props.open);
  const [isRevealed, setIsRevealed] = useState(false);
  const titleId = useId();

  const onClosed = useRef(props.onClosed);
  useEffect(() => {
    onClosed.current = props.onClosed;
  });

  // callers derive their content from the state that just closed, so it is frozen for the fade out
  const lastContent = useRef({ actions: props.actions, children: props.children, title: props.title });
  if (props.open) {
    lastContent.current = { actions: props.actions, children: props.children, title: props.title };
  }
  const { actions, children, title } = lastContent.current;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (props.open) {
      setIsMounted(true);
      if (!dialog.open) dialog.showModal();

      const frame = requestAnimationFrame(() => setIsRevealed(true));
      return () => cancelAnimationFrame(frame);
    }

    if (!dialog.open) return;

    setIsRevealed(false);
    const timeout = setTimeout(() => {
      dialog.close();
      setIsMounted(false);
      onClosed.current?.();
    }, FADE_DURATION_MS);

    return () => clearTimeout(timeout);
  }, [props.open]);

  return (
    <dialog
      aria-labelledby={titleId}
      className={clsx(
        'm-auto w-[calc(100vw-2rem)] border-0 bg-transparent p-0 transition-opacity duration-300 backdrop:bg-[rgba(22,22,22,0.64)] backdrop:transition-opacity backdrop:duration-300 motion-reduce:transition-none',
        isRevealed ? 'opacity-100 backdrop:opacity-100' : 'opacity-0 backdrop:opacity-0',
        !props.open && 'pointer-events-none',
        SIZE_CLASSES[props.size ?? 'medium'],
      )}
      id={props.id}
      inert={!props.open}
      onCancel={(event) => {
        // a file input dismissed without a selection fires its own `cancel`, and that one bubbles
        if (event.target !== event.currentTarget) return;

        event.preventDefault();
        props.onClose();
      }}
      onClick={(event) => {
        if (props.closeOnBackdrop === false) return;
        if (event.target === event.currentTarget) props.onClose();
      }}
      ref={dialogRef}
    >
      {isMounted && (
        <div className="flex max-h-[80dvh] flex-col bg-(--background-lifted-grey) text-(--text-default-grey) shadow-(--lifted-shadow)">
          <div className="flex shrink-0 justify-end px-8 py-4">
            <Button
              iconId="fr-icon-close-line"
              iconPosition="right"
              onClick={props.onClose}
              priority="tertiary no outline"
              size="small"
            >
              <FormattedMessage defaultMessage="Fermer" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-8 pb-6 [&>p]:leading-7">
            <h1 className="mb-4 text-2xl leading-8 font-bold text-(--text-title-grey)" id={titleId}>
              {title}
            </h1>
            {children}
          </div>
          {actions && (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-4 px-8 pt-6 pb-8">
              {actions}
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}
