import Button from '@codegouvfr/react-dsfr/Button';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { DocumentDraftBanner } from '../DocumentDraftBanner';
import { DocumentScreen } from '@/features/documents/components/DocumentScreen';
import {
  OfficialReportDocumentEditor,
  type OfficialReportDocumentEditorHandle,
} from '@/features/documents/components/official-report/editor';
import { OfficialReportBreadCrumb } from '@/features/documents/components/official-report/OfficialReportBreadCrumb';
import { useDocumentFailure } from '@/shared/hooks/useDocumentFailure';
import { useUnsavedChangesGuard } from '@/shared/hooks/useUnsavedChangesGuard';
import { AlertBanner } from '@/shared/ui/alert-banner';
import { useToasts } from '@/shared/ui/toast';
import { HttpException } from '@/utils/http-exception';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  officialReportKeys,
  useDetailsOfficialReportQuery,
  useOfficialReportDocumentQuery,
} from '@queries/agenda.queries';

export function OfficialReportEditPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toasts = useToasts();
  const { formatMessage } = useIntl();
  const describeFailure = useDocumentFailure();
  const { officialReportId, sessionId } = useParams<{ officialReportId: string; sessionId: string }>();

  const { data: document, isFetchedAfterMount } = useOfficialReportDocumentQuery({ id: officialReportId });
  const { data: metadata } = useDetailsOfficialReportQuery({ officialReportId });

  const [hasPendingRevalidation, setHasPendingRevalidation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(() => crypto.randomUUID());

  const editorRef = useRef<OfficialReportDocumentEditorHandle>(null);
  const rebuildEditorOnStoredBlocks = useCallback(() => setEditorKey(crypto.randomUUID()), []);

  const save = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await editorRef.current?.save();

      // the blocks are read again so the "modifié par vous" mention carries the stored date, and
      // the rendered document with them: the server dropped the one it had stored
      await queryClient.invalidateQueries({ queryKey: officialReportKeys.all(officialReportId!) });
      rebuildEditorOnStoredBlocks();

      // saving leaves the reader on the page, so nothing else would tell them it worked
      toasts.success({
        action: {
          label: formatMessage({ defaultMessage: "Voir l'aperçu" }),
          onClick: () =>
            navigate(
              generatePath(ROUTE_PATHS.SG.OFFICIAL_REPORT_PREVIEW, {
                officialReportId: officialReportId!,
                sessionId: sessionId!,
              }),
            ),
        },
        title: formatMessage({ defaultMessage: 'Vos modifications ont bien été enregistrées.' }),
      });
    } catch (error) {
      // the server explains a refused report far better than any message written here
      const refusal = error instanceof HttpException ? await error.response.json().catch(() => null) : null;
      setSaveError(refusal?.validationError ?? describeFailure(error));

      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [
    describeFailure,
    formatMessage,
    navigate,
    officialReportId,
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
          <Button disabled={isSaving || !isDirty} onClick={save}>
            {isSaving ? (
              <FormattedMessage defaultMessage="Enregistrement..." />
            ) : (
              <FormattedMessage defaultMessage="Enregistrer les changements" />
            )}
          </Button>
        </>
      }
      breadcrumb={<OfficialReportBreadCrumb />}
      notices={
        <>
          {/** @warning the live region is always rendered: a screen reader ignores one that appears already filled */}
          <div role="status">
            {metadata?.status === 'DRAFT' && (
              <DocumentDraftBanner hasValidatedVersion={metadata.hasValidatedVersion} />
            )}
            {hasPendingRevalidation && (
              <AlertBanner
                className="justify-center px-4 py-3"
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
                className="justify-center px-4 py-3"
                icon="fr-icon-error-fill"
                message={saveError}
                tone="error"
              />
            )}
          </div>
        </>
      }
      title={<FormattedMessage defaultMessage="Texte du PV de restitution" />}
    >
      {!isFetchedAfterMount || !officialReportId || !document ? (
        <i className="ri-loader-4-line m-auto animate-spin text-[2rem]" />
      ) : (
        <OfficialReportDocumentEditor
          blocks={document.blocks}
          handleRef={editorRef}
          key={editorKey}
          officialReportId={officialReportId}
          onDirtyChange={setDirty}
          onPendingRevalidationChange={setHasPendingRevalidation}
          sessionId={sessionId!}
        />
      )}
    </DocumentScreen>
  );
}
