import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import { useEffect, useId, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath } from 'react-router';

import { useSessionCommentDraft } from '@/features/transparence/hooks/useSessionCommentDraft';
import { IconLink } from '@/shared/ui/icon-link';
import { ROUTE_PATHS } from '@/utils/route-path.utils';

import { SessionCommentField } from './SessionCommentField';

export function SessionCommentPanel(props: { isArchived: boolean; sessionId: string }) {
  const { formatMessage } = useIntl();
  const panelId = useId();
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [isOpen, setOpen] = useState(false);
  const draft = useSessionCommentDraft({ sessionId: props.sessionId });

  function close() {
    setOpen(false);
    toggleRef.current?.focus();
  }

  function tryClose() {
    if (draft.tryLeave()) close();
  }

  const tryCloseRef = useRef(tryClose);
  tryCloseRef.current = tryClose;

  useEffect(() => {
    const toolbar = toolbarRef.current;
    if (!toolbar) return;

    const root = document.documentElement;
    const observer = new ResizeObserver(() =>
      root.style.setProperty(
        '--fondation-toast-offset',
        `${window.innerHeight - toolbar.getBoundingClientRect().top}px`,
      ),
    );
    observer.observe(toolbar);

    return () => {
      observer.disconnect();
      root.style.removeProperty('--fondation-toast-offset');
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (event.target instanceof Element && event.target.closest('dialog, [role="dialog"], .fr-modal'))
        return;
      tryCloseRef.current();
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target instanceof Element ? event.target : null;
      if (!target || rootRef.current?.contains(target)) return;
      if (target.closest('dialog, [role="dialog"], .fr-modal')) return;
      tryCloseRef.current();
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [isOpen]);

  return (
    <div
      className="pointer-events-none fixed right-[calc(var(--fondation-side-panel-width)+1.5rem)] bottom-6 z-(--z-index-panel) flex flex-col items-end gap-2 transition-[right] duration-300 ease-out motion-reduce:transition-none"
      data-side-panel-companion
      ref={rootRef}
    >
      <section
        aria-labelledby={titleId}
        className={clsx(
          'fr-p-3w w-[min(40rem,calc(100vw-var(--fondation-side-panel-width)-3rem))] rounded-lg border border-solid border-(--border-default-grey) bg-(--background-default-grey) shadow-[0_4px_12px_rgba(0,0,0,0.08)]',
          'transition-[opacity,translate,visibility] duration-200 ease-out motion-reduce:transition-none',
          isOpen
            ? 'pointer-events-auto visible translate-y-0 opacity-100'
            : 'pointer-events-none invisible translate-y-2 opacity-0',
        )}
        id={panelId}
        inert={!isOpen}
      >
        <div className="fr-mb-1v flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="fr-h5 fr-mb-0" id={titleId}>
              <FormattedMessage defaultMessage="Commentaire" />
            </h2>
            <IconLink
              iconId="fr-icon-external-link-line"
              label={formatMessage({ defaultMessage: 'Ouvrir en pleine page dans un nouvel onglet' })}
              newTab
              small
              to={generatePath(ROUTE_PATHS.SG.SESSION_ID_COMMENT, { sessionId: props.sessionId })}
            />
          </div>
          <Button
            iconId="fr-icon-close-line"
            iconPosition="right"
            onClick={tryClose}
            priority="tertiary no outline"
            size="small"
          >
            <FormattedMessage defaultMessage="Fermer" />
          </Button>
        </div>

        <SessionCommentField draft={draft} isArchived={props.isArchived} rows={10} />
        {!props.isArchived && (
          <div className="fr-mt-4v flex justify-end gap-2">
            <Button
              className="btn-compact"
              disabled={!draft.isDirty || draft.isPending}
              onClick={draft.cancel}
              priority="secondary"
              size="small"
            >
              <FormattedMessage defaultMessage="Annuler les changements" />
            </Button>
            <Button
              className="btn-compact"
              disabled={!draft.isDirty || draft.isPending}
              onClick={() => void draft.save().then(close, () => {})}
              size="small"
            >
              <FormattedMessage defaultMessage="Valider le commentaire" />
            </Button>
          </div>
        )}
      </section>

      <div
        className="fr-p-1v pointer-events-auto border border-solid border-(--border-default-grey) bg-(--background-default-grey) shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
        ref={toolbarRef}
      >
        <Button
          aria-controls={panelId}
          aria-expanded={isOpen}
          className={clsx({ 'bg-(--background-action-low-blue-france)': isOpen })}
          iconId="fr-icon-chat-3-line"
          onClick={() => (isOpen ? tryClose() : setOpen(true))}
          priority="tertiary no outline"
          ref={toggleRef}
          size="small"
        >
          <FormattedMessage defaultMessage="Commentaire" />
        </Button>
      </div>
    </div>
  );
}
