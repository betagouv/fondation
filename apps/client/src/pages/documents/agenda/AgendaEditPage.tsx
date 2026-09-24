import Button from '@codegouvfr/react-dsfr/Button';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, Link, useLocation, useNavigate, useParams } from 'react-router';

import { DocumentDraftBanner } from '../DocumentDraftBanner';
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
  useValidateAgendaMutation,
} from '@queries/agenda.queries';
import { sessionKeys } from '@queries/nomination-sessions.queries';

import { AgendaReportersChangedBanner } from './AgendaReportersChangedBanner';

export function AgendaEditPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toasts = useToasts();
  const { formatMessage } = useIntl();
  const describeFailure = useDocumentFailure();
  const { agendaId, sessionId } = useParams<{ agendaId: string; sessionId: string }>();
  const { state } = useLocation();
  const officialReportPath: string | null =
    typeof state?.officialReportPath === 'string' ? state.officialReportPath : null;

  const { data: document, isFetchedAfterMount } = useAgendaDocumentBlocksQuery({ id: agendaId });
  const { data: metadata, refetch: refetchMetadata } = useDetailsAgendaMetadataQuery({ agendaId });

  const [pendingRevalidations, setPendingRevalidations] = useState({ others: 0, propositions: 0 });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(() => crypto.randomUUID());

  const editorRef = useRef<AgendaDocumentEditorHandle>(null);

  const { mutateAsync: validateAgenda } = useValidateAgendaMutation({
    agendaId: agendaId!,
    sessionId: sessionId!,
  });

  // the report only follows a validated agenda: going back to it validates first, or the reader
  // would find the report still reading the former sentence
  const validateAndReturnToOfficialReport = useCallback(async () => {
    if (!officialReportPath) return;

    setSaveError(null);
    try {
      const { data: latest } = await refetchMetadata();
      if (latest?.status === 'DRAFT') await validateAgenda();
      await navigate(officialReportPath);
    } catch (error) {
      setSaveError(describeFailure(error));
    }
  }, [describeFailure, navigate, officialReportPath, refetchMetadata, validateAgenda]);

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
      // the first save of a validated agenda opens its draft, which the banner has to tell
      await queryClient.invalidateQueries({ queryKey: agendaKeys.detailsAgendaMetadata({ agendaId }) });

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
        action: officialReportPath
          ? undefined
          : {
              label: formatMessage({ defaultMessage: "Voir l'aperçu" }),
              onClick: () =>
                navigate(
                  generatePath(ROUTE_PATHS.SG.AGENDA_PREVIEW, {
                    agendaId: agendaId!,
                    sessionId: sessionId!,
                  }),
                ),
            },
        description: officialReportPath
          ? formatMessage({ defaultMessage: "Validez l'ODJ pour qu'elles apparaissent dans le PV." })
          : undefined,
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
    officialReportPath,
    queryClient,
    rebuildEditorOnStoredBlocks,
    sessionId,
    toasts,
  ]);

  const { isDirty, setDirty } = useUnsavedChangesGuard({ onSave: save });
  const canValidate = !isSaving && !isDirty && metadata?.status === 'DRAFT';

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
          <Button
            disabled={isSaving || !isDirty}
            iconId="fr-icon-arrow-go-back-line"
            onClick={cancel}
            priority="secondary"
          >
            <FormattedMessage defaultMessage="Annuler les changements" />
          </Button>
          <Button
            disabled={isSaving || !isDirty}
            onClick={() => void save().catch(() => {})}
            priority={!officialReportPath || isDirty ? 'primary' : 'secondary'}
          >
            {isSaving ? (
              <FormattedMessage defaultMessage="Enregistrement..." />
            ) : (
              <FormattedMessage defaultMessage="Enregistrer les changements" />
            )}
          </Button>
          {officialReportPath && (
            <Button
              disabled={!canValidate}
              onClick={() => void validateAndReturnToOfficialReport()}
              priority={canValidate ? 'primary' : 'secondary'}
            >
              <FormattedMessage defaultMessage="Valider" />
            </Button>
          )}
        </>
      }
      backLink={
        officialReportPath && (
          <Link className="fr-link fr-link--icon-left fr-icon-arrow-left-line" to={officialReportPath}>
            <FormattedMessage defaultMessage="Revenir au PV" />
          </Link>
        )
      }
      breadcrumb={<AgendaBreadCrumb />}
      notices={
        <>
          {/** @warning the live region is always rendered: a screen reader ignores one that appears already filled */}
          <div role="status">
            {metadata?.status === 'DRAFT' && (
              <DocumentDraftBanner
                draft={metadata.draft}
                hasValidatedVersion={metadata.hasValidatedVersion}
                kind="agenda"
              />
            )}
            {(pendingRevalidations.propositions > 0 || pendingRevalidations.others > 0) && (
              <AgendaReportersChangedBanner propositions={pendingRevalidations.propositions} />
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
          withPreview={!officialReportPath}
        />
      )}
    </DocumentScreen>
  );
}
