import Button from '@codegouvfr/react-dsfr/Button';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { DocumentDraftBanner } from '../DocumentDraftBanner';
import { DocumentDriftBanner } from '../DocumentDriftBanner';
import { AgendaBreadCrumb } from '@/features/documents/components/agenda/AgendaBreadcrumb';
import {
  AgendaDocumentEditor,
  type AgendaDocumentEditorHandle,
} from '@/features/documents/components/agenda/editor';
import { AgendaEmptied } from '@/features/documents/components/agenda/editor/blocks/agenda-blocks.model';
import { DocumentScreen } from '@/features/documents/components/DocumentScreen';
import { useDocumentFailure } from '@/shared/hooks/useDocumentFailure';
import { useUnsavedChangesGuard } from '@/shared/hooks/useUnsavedChangesGuard';
import { AlertBanner } from '@/shared/ui/alert-banner';
import { useToasts } from '@/shared/ui/toast';
import { HttpException } from '@/utils/http-exception';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  agendaKeys,
  officialReportKeys,
  useAgendaDocumentBlocksQuery,
  useDetailsAgendaMetadataQuery,
} from '@queries/agenda.queries';
import { sessionKeys } from '@queries/nomination-sessions.queries';

export function AgendaEditPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toasts = useToasts();
  const { formatMessage } = useIntl();
  const describeFailure = useDocumentFailure();
  const { agendaId, sessionId } = useParams<{ agendaId: string; sessionId: string }>();

  const { data: document, isFetchedAfterMount } = useAgendaDocumentBlocksQuery({ id: agendaId });
  const { data: metadata } = useDetailsAgendaMetadataQuery({ agendaId });

  const [pendingRevalidations, setPendingRevalidations] = useState({ others: 0, propositions: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(() => crypto.randomUUID());

  const editorRef = useRef<AgendaDocumentEditorHandle>(null);
  const rebuildEditorOnStoredBlocks = useCallback(() => setEditorKey(crypto.randomUUID()), []);

  const save = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const saved = await editorRef.current?.save();

      // the blocks are read again so the edition mention carries the stored date, and
      // the rendered document with them: the server dropped the one it had stored
      await queryClient.invalidateQueries({ queryKey: agendaKeys.documentBlocks(agendaId) });
      await queryClient.invalidateQueries({ queryKey: agendaKeys.agendaHtml(agendaId!) });

      if (saved?.hasRemovedPropositions) {
        await queryClient.invalidateQueries({ queryKey: agendaKeys.findSessionDocs(sessionId!) });
        await queryClient.invalidateQueries({
          queryKey: agendaKeys.findAgendaNominationFiles({ sessionId: sessionId! }),
        });
        await queryClient.invalidateQueries({ queryKey: agendaKeys.detailsAgendaFiles({ agendaId }) });
        await queryClient.invalidateQueries({
          queryKey: sessionKeys.listSessionNominationFiles({ sessionId: sessionId! }),
        });
        await queryClient.invalidateQueries({ queryKey: officialReportKeys.all() });
      }

      rebuildEditorOnStoredBlocks();

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
            <FormattedMessage defaultMessage="Annuler les changements" />
          </Button>
          <Button disabled={isSaving || !isDirty} onClick={() => void save().catch(() => {})}>
            {isSaving ? (
              <FormattedMessage defaultMessage="Enregistrement..." />
            ) : (
              <FormattedMessage defaultMessage="Enregistrer les changements" />
            )}
          </Button>
        </>
      }
      breadcrumb={<AgendaBreadCrumb />}
      notices={
        <>
          {/** @warning the live region is always rendered: a screen reader ignores one that appears already filled */}
          <div role="status">
            {metadata?.status === 'DRAFT' && (
              <DocumentDraftBanner hasValidatedVersion={metadata.hasValidatedVersion} />
            )}
            {(pendingRevalidations.propositions > 0 || pendingRevalidations.others > 0) && (
              <DocumentDriftBanner outdatedPropositions={pendingRevalidations.propositions} />
            )}
          </div>
          <div role="alert">
            {!!saveError && (
              <AlertBanner
                className="justify-center px-4 py-3"
                icon="fr-icon-error-fill"
                message={saveError}
                tone="error"
              />
            )}
          </div>
        </>
      }
      title={<FormattedMessage defaultMessage="Texte de l'ordre du jour" />}
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
          onPendingRevalidationChange={setPendingRevalidations}
          sessionId={sessionId!}
        />
      )}
    </DocumentScreen>
  );
}
