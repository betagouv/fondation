import Button from '@codegouvfr/react-dsfr/Button';
import Input from '@codegouvfr/react-dsfr/Input';
import clsx from 'clsx';
import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { FloatingAction } from '@/shared/context/floating-actions';
import { useToasts } from '@/shared/ui/toast';
import { useUser } from '@queries/auth.queries';
import { useSendFeedbackMutation } from '@queries/feedbacks.queries';

function FeedbackForm() {
  const { formatMessage } = useIntl();
  const toasts = useToasts();
  const send = useSendFeedbackMutation();
  const panelId = useId();
  const titleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setOpen] = useState(false);
  const [text, setText] = useState('');

  const close = useCallback(() => {
    setOpen(false);
    toggleRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    rootRef.current?.querySelector('textarea')?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (event.target instanceof Element && event.target.closest('dialog, [role="dialog"], .fr-modal'))
        return;
      close();
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target instanceof Element ? event.target : null;
      if (!target || rootRef.current?.contains(target)) return;
      if (target.closest('dialog, [role="dialog"], .fr-modal')) return;
      setOpen(false);
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [close, isOpen]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    // nuqs writes its parameters, such as the opened side panel, without telling React Router: only the browser knows them
    const { pathname, search } = window.location;
    send.mutate(
      { text, url: `${pathname}${search}` },
      {
        onError: () =>
          toasts.error({
            title: formatMessage({ defaultMessage: "Votre retour n'a pas pu être envoyé" }),
          }),
        onSuccess: () => {
          setText('');
          close();
          toasts.success({
            title: formatMessage({ defaultMessage: 'Merci, votre retour a bien été envoyé' }),
          });
        },
      },
    );
  };

  return (
    <FloatingAction>
      {/* mounted before the session comment, it still has to come last, in the corner */}
      <div className="relative order-last shrink-0" ref={rootRef}>
        {/* above the button rather than beside it: even hidden, it would push the other actions aside */}
        <section
          aria-labelledby={titleId}
          className={clsx(
            'fr-p-3w absolute right-0 bottom-full mb-2 w-[min(40rem,calc(100vw-var(--fondation-side-panel-width,0px)-3rem))] rounded-lg border border-solid border-(--border-default-grey) bg-(--background-default-grey) shadow-[0_4px_12px_rgba(0,0,0,0.08)]',
            'transition-[opacity,translate,visibility] duration-200 ease-out motion-reduce:transition-none',
            isOpen
              ? 'pointer-events-auto visible translate-y-0 opacity-100'
              : 'pointer-events-none invisible translate-y-2 opacity-0',
          )}
          id={panelId}
          inert={!isOpen}
        >
          <div className="mb-2.5 flex items-center justify-between gap-4">
            <h2 className="fr-h5 fr-mb-0" id={titleId}>
              <FormattedMessage defaultMessage="Faire un retour" />
            </h2>
            <Button
              iconId="fr-icon-close-line"
              iconPosition="right"
              onClick={close}
              priority="tertiary no outline"
              size="small"
            >
              <FormattedMessage defaultMessage="Fermer" />
            </Button>
          </div>
          <form onSubmit={submit}>
            <Input
              classes={{ nativeInputOrTextArea: 'fr-mt-3v' }}
              className="fr-mb-0"
              hintText={
                <FormattedMessage defaultMessage="Une suggestion, une idée d'évolution ou un problème rencontré ? Votre retour sera étudié par l'équipe produit et technique." />
              }
              label={
                <span className="fr-sr-only">
                  <FormattedMessage defaultMessage="Votre retour" />
                </span>
              }
              nativeTextAreaProps={{
                maxLength: 2_000,
                onChange: (event) => setText(event.target.value),
                required: true,
                rows: 8,
                value: text,
              }}
              textArea
            />
            <div className="fr-mt-4v flex justify-end gap-2">
              <Button
                className="btn-compact"
                disabled={send.isPending || !text.trim()}
                size="small"
                type="submit"
              >
                <FormattedMessage defaultMessage="Envoyer" />
              </Button>
            </div>
          </form>
        </section>

        <div className="fr-p-1v pointer-events-auto border border-solid border-(--border-action-high-blue-france) bg-(--background-default-grey) whitespace-nowrap shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
          <Button
            aria-controls={panelId}
            aria-expanded={isOpen}
            className={clsx({ 'bg-(--background-action-low-blue-france)': isOpen })}
            iconId="fr-icon-question-answer-line"
            onClick={() => (isOpen ? close() : setOpen(true))}
            priority="tertiary no outline"
            ref={toggleRef}
            size="small"
          >
            <FormattedMessage defaultMessage="Un retour ?" />
          </Button>
        </div>
      </div>
    </FloatingAction>
  );
}

export function FeedbackButton() {
  const { user } = useUser();

  if (!user) return null;

  return <FeedbackForm />;
}
