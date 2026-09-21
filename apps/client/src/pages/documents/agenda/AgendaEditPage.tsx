import Button from '@codegouvfr/react-dsfr/Button';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import {
  AgendaDocumentEditor,
  type AgendaDocumentEditorHandle,
} from '@/features/documents/components/agenda/editor';
import { AgendaEmptied } from '@/features/documents/components/agenda/editor/blocks/agenda-blocks.model';
import { DocumentScreen } from '@/features/documents/components/DocumentScreen';
import { useDocumentFailure } from '@/shared/hooks/useDocumentFailure';
import { useUnsavedChangesGuard } from '@/shared/hooks/useUnsavedChangesGuard';
import { AlertBanner } from '@/shared/ui/alert-banner';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { useToasts } from '@/shared/ui/toast';
import { HttpException } from '@/utils/http-exception';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  agendaKeys,
  useAgendaDocumentBlocksQuery,
  useDetailsAgendaMetadataQuery,
} from '@queries/agenda.queries';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

import { AgendaDraftBanner } from './AgendaDraftBanner';

export function AgendaEditPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toasts = useToasts();
  const { formatMessage } = useIntl();
  const describeFailure = useDocumentFailure();
  const { agendaId, sessionId } = useParams<{ agendaId: string; sessionId: string }>();

  const { data: session } = useDetailedNominationSessionQuery({ sessionId });
  const { data: document, isFetchedAfterMount } = useAgendaDocumentBlocksQuery({ id: agendaId });
  const { data: metadata } = useDetailsAgendaMetadataQuery({ agendaId });

  const [hasPendingRevalidation, setHasPendingRevalidation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(() => crypto.randomUUID());

  const editorRef = useRef<AgendaDocumentEditorHandle>(null);
  const rebuildEditorOnStoredBlocks = useCallback(() => setEditorKey(crypto.randomUUID()), []);

  const save = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await editorRef.current?.save();

      // the blocks are read again so the "modifié par vous" mention carries the stored date
      await queryClient.invalidateQueries({ queryKey: agendaKeys.documentBlocks(agendaId) });
      rebuildEditorOnStoredBlocks();

      // saving leaves the reader on the page, so nothing else would tell them it worked
      toasts.success({
        action: {
          label: formatMessage({ defaultMessage: "Voir l'aperçu" }),
          onClick: () =>
            navigate(
              generatePath(ROUTE_PATHS.SG.AGENDA_PREVIEW, {
                agendaId: agendaId!,
                sessionId: sessionId!,
              }),
            ),
        },
        title: formatMessage({ defaultMessage: 'Vos modifications ont bien été enregistrées.' }),
      });
    } catch (error) {
      if (error instanceof AgendaEmptied) throw error;

      // the server explains a refused agenda far better than any message written here
      const refusal = error instanceof HttpException ? await error.response.json().catch(() => null) : null;
      setSaveError(refusal?.validationError ?? describeFailure(error));

      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [
    agendaId,
    describeFailure,
    formatMessage,
    navigate,
    queryClient,
    rebuildEditorOnStoredBlocks,
    sessionId,
    toasts,
  ]);

  const { isDirty, setDirty } = useUnsavedChangesGuard({ onSave: save });

  // nothing was sent, so the stored blocks are still the last save
  const cancel = () => {
    editorRef.current?.discard();
    setSaveError(null);
    rebuildEditorOnStoredBlocks();
  };

  return (
    <DocumentScreen
      actions={
        <>
          <Button disabled={isSaving || !isDirty} onClick={cancel} priority="secondary">
            <FormattedMessage defaultMessage="Annuler" />
          </Button>
          <Button disabled={isSaving || !isDirty} onClick={save}>
            {isSaving ? (
              <FormattedMessage defaultMessage="Enregistrement..." />
            ) : (
              <FormattedMessage defaultMessage="Enregistrer les changements" />
            )}
          </Button>
        </>
      }
      breadcrumb={
        <Breadcrumb
          ariaLabel="fil d'Ariane"
          breadcrumb={{
            currentPageLabel: "Édition de l'ordre du jour",
            segments: [
              { label: 'Secrétariat Général', to: generatePath(ROUTE_PATHS.SG.DASHBOARD) },
              { label: 'Sessions', to: generatePath(ROUTE_PATHS.SG.MANAGE_SESSION) },
              {
                label: session?.name || 'Session',
                to: generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId: sessionId! }),
              },
            ],
          }}
          id="breadcrumb"
        />
      }
      notices={
        <>
          {/** @warning the live region is always rendered: a screen reader ignores one that appears already filled */}
          <div role="status">
            {metadata?.status === 'DRAFT' && (
              <AgendaDraftBanner hasValidatedVersion={metadata.hasValidatedVersion} />
            )}
            {hasPendingRevalidation && (
              <AlertBanner
                className="fr-mt-4v px-4 py-3"
                icon="fr-icon-warning-fill"
                message={
                  <FormattedMessage defaultMessage="Certains dossiers ont changé et doivent être validés" />
                }
                tone="warning"
              />
            )}
          </div>
          <div role="alert">
            {!!saveError && (
              <AlertBanner
                className="fr-mt-4v px-4 py-3"
                icon="fr-icon-error-fill"
                message={saveError}
                tone="error"
              />
            )}
          </div>
        </>
      }
      subtitle={session?.name}
      title={<FormattedMessage defaultMessage="Ordre du jour" />}
    >
      {!isFetchedAfterMount || !agendaId || !document ? (
        <i className="ri-loader-4-line m-auto animate-spin text-[2rem]" />
      ) : (
        <AgendaDocumentEditor
          agendaId={agendaId}
          blocks={document.blocks}
          handleRef={editorRef}
          key={editorKey}
          onDirtyChange={setDirty}
          onPendingRevalidationChange={setHasPendingRevalidation}
          sessionId={sessionId!}
        />
      )}
    </DocumentScreen>
  );
}
