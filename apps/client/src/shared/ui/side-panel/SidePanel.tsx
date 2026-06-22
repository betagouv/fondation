import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import { useEffect, useRef, type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

export function SidePanel(props: {
  ariaLabel?: string;
  ariaLabelledBy?: string;
  children: ReactNode;
  header?: ReactNode;
  id?: string;
  onClose: () => void;
  open: boolean;
}) {
  const { ariaLabel, ariaLabelledBy, children, header, id, onClose, open } = props;
  const panelRef = useRef<HTMLElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      panelRef.current?.focus();
    } else {
      previouslyFocused.current?.focus();
      previouslyFocused.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      if (target.closest('[role="dialog"]')) return;
      if (id && target.closest(`[aria-controls="${id}"]`)) return;
      onClose();
    }

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, id, onClose]);

  useEffect(() => {
    if (!open) return;

    const root = document.documentElement;
    const scrollbarWidth = window.innerWidth - root.clientWidth;
    const previousPaddingRight = document.body.style.paddingRight;

    root.style.setProperty('scrollbar-width', 'none');
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      root.style.removeProperty('scrollbar-width');
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [open]);

  return (
    <aside
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-modal="false"
      className={clsx(
        'fixed inset-y-0 right-0 z-1000 flex h-full w-full max-w-full flex-col bg-(--background-default-grey) shadow-[-8px_0_24px_rgba(0,0,0,0.16)] transition duration-300 ease-out outline-none md:w-1/2',
        open ? 'translate-x-0 opacity-100' : 'pointer-events-none translate-x-full opacity-0',
      )}
      inert={!open}
      id={id}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
      ref={panelRef}
      role="dialog"
      tabIndex={-1}
    >
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-(--border-default-grey) px-4 py-3">
        <div className="flex items-center gap-2">{header}</div>
        <Button
          iconId="fr-icon-close-line"
          iconPosition="right"
          onClick={onClose}
          priority="tertiary no outline"
          size="small"
        >
          <FormattedMessage defaultMessage="Fermer" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">{children}</div>
    </aside>
  );
}
