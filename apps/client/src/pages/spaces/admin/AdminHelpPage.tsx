import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import { useCallback, useEffect, useRef, useState } from 'react';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';

import { HelpPageContent } from '@/features/help/components/HelpPageContent';
import { HelpPageEditor } from '@/features/help/components/HelpPageEditor';
import { PinnedHeader } from '@/shared/components/pinned-header';
import { useConfirmModal } from '@/shared/context/confirm-modal';
import { useUnsavedChangesGuard } from '@/shared/hooks/useUnsavedChangesGuard';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { useToasts } from '@/shared/ui/toast';
import { type HelpPageEnum, useHelpPageQuery, useWriteHelpPageContentMutation } from '@queries/help.queries';

const TITLE_ID = 'admin-help-title';

const HELP_TABS: readonly { label: { defaultMessage: string }; page: HelpPageEnum }[] = [
  { label: defineMessage({ defaultMessage: 'Secrétariat général' }), page: 'SECRETARIAT_GENERAL' },
  { label: defineMessage({ defaultMessage: 'Membres' }), page: 'MEMBRE' },
];

export function AdminHelpPage() {
  const { formatDate, formatMessage, formatTime } = useIntl();
  const toasts = useToasts();
  const { waitForConfirmation } = useConfirmModal();
  const [page, setPage] = useState<HelpPageEnum>('SECRETARIAT_GENERAL');
  const [draft, setDraftState] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  // remounting the editor is how a draft is thrown away
  const [editorKey, setEditorKey] = useState(0);

  const { data } = useHelpPageQuery({ page });
  const { isPending: isSaving, mutateAsync: writeContent } = useWriteHelpPageContentMutation();

  // the guard calls the save of the moment it fires, while the save is built after the guard
  const saveRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const { setDirty } = useUnsavedChangesGuard({ onSave: useCallback(() => saveRef.current(), []) });
  // what the editor holds at the end of a request, which may differ from what the request sent
  const draftRef = useRef<string | null>(null);
  const setDraft = useCallback(
    (next: string | null) => {
      draftRef.current = next;
      setDraftState(next);
      setDirty(next !== null);
    },
    [setDirty],
  );

  const save = useCallback(async () => {
    if (draft === null) return;
    try {
      await writeContent({ content: draft, page });
    } catch (error) {
      toasts.error({ title: formatMessage({ defaultMessage: "La page n'a pas pu être enregistrée" }) });
      throw error;
    }
    // what was typed during the request is still to save
    if (draftRef.current === draft) setDraft(null);
    toasts.success({ title: formatMessage({ defaultMessage: 'Page enregistrée' }) });
  }, [draft, formatMessage, page, setDraft, toasts, writeContent]);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const discard = () => {
    setDraft(null);
    setEditorKey((key) => key + 1);
  };

  // a draft belongs to its page: the other one opens once it is saved or thrown away
  const onTabChange = async (next: HelpPageEnum) => {
    if (draft !== null) {
      const { isConfirmed } = await waitForConfirmation({
        content: formatMessage({
          defaultMessage: "Vos modifications n'ont pas été enregistrées. Voulez-vous les abandonner ?",
        }),
        i18n: {
          cancel: formatMessage({ defaultMessage: 'Rester sur la page' }),
          confirm: formatMessage({ defaultMessage: 'Abandonner' }),
        },
        title: formatMessage({ defaultMessage: 'Modifications non enregistrées' }),
      });
      if (!isConfirmed) return;
      discard();
    }
    setPage(next);
  };

  return (
    <div className="fr-container fr-pt-8v fr-pb-16v">
      <Breadcrumb
        ariaLabel={formatMessage({ defaultMessage: "Fil d'Ariane pour l'Administration" })}
        breadcrumb={{
          currentPageLabel: formatMessage({ defaultMessage: "Rédiger le centre d'aide" }),
          segments: [{ label: formatMessage({ defaultMessage: 'Administration' }), to: {} }],
        }}
        id="administration-breadcrumb"
      />

      <PinnedHeader
        bar={(isPinned) => (
          <div className={clsx('flex flex-col gap-y-6', { 'fr-container': isPinned })}>
            <h1 className="fr-h3 fr-mb-0" id={TITLE_ID}>
              <FormattedMessage defaultMessage="Rédiger le centre d'aide" />
            </h1>
            <p className="fr-mb-0 max-w-3xl leading-7 text-(--text-mention-grey)" data-collapse-natural>
              <FormattedMessage defaultMessage="Une page par espace, lue depuis le bouton Centre d'aide de l'en-tête. Les modifications sont visibles dès leur enregistrement." />
            </p>
            {data?.updatedBy && (
              <p className="fr-hint-text fr-mb-0 -mb-4 self-end" data-collapse-natural>
                <FormattedMessage
                  defaultMessage="Mise à jour le {date} à {time} par {name}"
                  values={{
                    date: formatDate(data.updatedAt, { format: 'zonedDateShort' }),
                    name: data.updatedBy.name,
                    time: formatTime(data.updatedAt, { format: 'zonedTimeShort' }),
                  }}
                />
              </p>
            )}
            {/* the tabs of the DSFR carry their panel along: here the panel stays with the page while the tabs pin */}
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-(--border-default-grey)">
              <ul className="fr-tabs__list fr-p-0 order-first! my-0! w-auto!" role="tablist">
                {HELP_TABS.map((tab) => (
                  <li key={tab.page} role="presentation">
                    <button
                      aria-selected={page === tab.page}
                      className="fr-tabs__tab"
                      onClick={() => void onTabChange(tab.page)}
                      role="tab"
                      type="button"
                    >
                      {formatMessage(tab.label)}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="fr-pb-2v flex flex-wrap items-center gap-4">
                <Button disabled={draft === null} onClick={discard} priority="secondary">
                  <FormattedMessage defaultMessage="Abandonner" />
                </Button>
                <Button disabled={draft === null || isSaving} onClick={() => void save().catch(() => {})}>
                  <FormattedMessage defaultMessage="Enregistrer" />
                </Button>
              </div>
            </div>
          </div>
        )}
        // no strip between the tabs and their panel: the frame of the panel starts at the line of the tabs
        contentClassName="flex flex-col [--fondation-table-header-top:calc(var(--fondation-banner-height)+var(--fondation-pinned-bar-height))]"
        gapClassName="h-0!"
        pinnedBarClassName="fr-pt-4v"
      >
        <div
          aria-labelledby={TITLE_ID}
          className="border-x border-b border-(--border-default-grey)"
          role="tabpanel"
        >
          {data && (
            <>
              {/* the preview shows the page as its readers will see it, summary included, while the editor keeps its state out of sight */}
              {isPreviewing && (
                <>
                  <div className="fr-p-2v flex justify-end pt-3.5!">
                    <Button
                      iconId="fr-icon-edit-line"
                      iconPosition="right"
                      onClick={() => setIsPreviewing(false)}
                      priority="tertiary no outline"
                      size="small"
                    >
                      <FormattedMessage defaultMessage="Retour à l'édition" />
                    </Button>
                  </div>
                  <div className="fr-p-6v">
                    <HelpPageContent content={draft ?? data.content} />
                  </div>
                </>
              )}
              <div hidden={isPreviewing}>
                <HelpPageEditor
                  ariaLabelledby={TITLE_ID}
                  content={data.content}
                  key={`${page}-${editorKey}`}
                  onDraftChange={setDraft}
                  onPreview={() => setIsPreviewing(true)}
                  page={page}
                />
              </div>
            </>
          )}
        </div>
      </PinnedHeader>
    </div>
  );
}
