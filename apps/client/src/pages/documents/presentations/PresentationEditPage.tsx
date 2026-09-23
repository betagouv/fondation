import Button from '@codegouvfr/react-dsfr/Button';
import { useCallback, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, Navigate, useNavigate, useParams } from 'react-router';

import { DocumentHtmlEditor } from '@/features/documents/components/DocumentHtmlEditor';
import { DocumentScreen } from '@/features/documents/components/DocumentScreen';
import { DocumentViewer } from '@/features/documents/components/DocumentViewer';
import { PresentationBreadcrumb } from '@/features/documents/components/presentations/PresentationBreadcrumb';
import { useConfirmModal } from '@/shared/context/confirm-modal';
import { useDocumentFailure } from '@/shared/hooks/useDocumentFailure';
import { useUnsavedChangesGuard } from '@/shared/hooks/useUnsavedChangesGuard';
import { AlertBanner } from '@/shared/ui/alert-banner';
import { useToasts } from '@/shared/ui/toast';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  useJusticePresentationPlanHtmlQuery,
  useJusticePresentationPlanMetadataQuery,
  useResetPresentationPlanDocumentMutation,
  useUpdatePresentationPlanHtmlMutation,
} from '@queries/agenda.queries';

export function PresentationEditPage() {
  const { formatMessage } = useIntl();
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const toasts = useToasts();
  const describeFailure = useDocumentFailure();

  const {
    data: html,
    isPending,
    refetch: refetchHtml,
  } = useJusticePresentationPlanHtmlQuery({ presentationPlanId: planId });
  const { data: metadata } = useJusticePresentationPlanMetadataQuery({ presentationPlanId: planId });
  const updateHtml = useUpdatePresentationPlanHtmlMutation(planId!);
  const revert = useResetPresentationPlanDocumentMutation(planId!);
  const confirmation = useConfirmModal();

  /** a ref, not a state: the guard saves from a callback it captured before the last keystroke */
  const draftRef = useRef<string | null>(null);
  const [editorKey, setEditorKey] = useState(() => crypto.randomUUID());
  const [reloadKey, setReloadKey] = useState(() => crypto.randomUUID());

  const previewPath = generatePath(ROUTE_PATHS.SG.PRESENTATIONS_PREVIEW, { planId: planId! });
  const seePreview = {
    label: formatMessage({ defaultMessage: "Voir l'aperçu" }),
    onClick: () => void navigate(previewPath),
  };

  const persistDraft = useCallback(async () => {
    if (draftRef.current) await updateHtml.mutateAsync({ html: draftRef.current });
    draftRef.current = null;
  }, [updateHtml]);

  const { isDirty, setDirty } = useUnsavedChangesGuard({ onSave: persistDraft });

  const onDraftChange = useCallback(
    (next: string) => {
      draftRef.current = next;
      setDirty(true);
    },
    [setDirty],
  );

  const save = async () => {
    try {
      await persistDraft();
    } catch (error: unknown) {
      return toasts.error({
        description: describeFailure(error),
        title: formatMessage({ defaultMessage: "L'enregistrement du texte a échoué" }),
      });
    }

    setDirty(false);
    setReloadKey(crypto.randomUUID());

    toasts.success({
      action: seePreview,
      title: formatMessage({ defaultMessage: 'Vos modifications ont bien été enregistrées.' }),
    });
  };

  const cancel = () => {
    draftRef.current = null;
    setDirty(false);
    setEditorKey(crypto.randomUUID());
  };

  const revertToGenerated = async () => {
    const { isConfirmed } = await confirmation.waitForConfirmation({
      content: (
        <>
          <p>
            <FormattedMessage defaultMessage="Vous allez perdre le texte écrit à la main dans cette notice, sans pouvoir le récupérer." />
          </p>
          <p>
            <FormattedMessage defaultMessage="Voulez-vous continuer?" />
          </p>
        </>
      ),
      title: formatMessage({ defaultMessage: `Revenir au texte généré` }),
    });

    if (!isConfirmed) return;

    try {
      await revert.mutateAsync();
      // the editor only reads the document when it mounts, so the regenerated one has to be here first
      await refetchHtml();
    } catch (error: unknown) {
      return toasts.error({
        description: describeFailure(error),
        title: formatMessage({ defaultMessage: 'Le retour au texte généré a échoué' }),
      });
    }

    cancel();
    setReloadKey(crypto.randomUUID());

    toasts.success({
      action: seePreview,
      title: formatMessage({ defaultMessage: 'La notice est revenue à son texte généré.' }),
    });
  };

  const isSaving = updateHtml.isPending;
  const isReverting = revert.isPending;
  const title = formatMessage({ defaultMessage: 'Notice de restitution' });

  if (metadata?.isPresented) return <Navigate replace to={previewPath} />;

  return (
    <DocumentScreen
      actions={
        <>
          {metadata?.isManuallyEdited && (
            <Button disabled={isReverting} onClick={() => void revertToGenerated()} priority="secondary">
              <FormattedMessage defaultMessage="Revenir au texte généré" />
            </Button>
          )}
          <Button disabled={isSaving || !isDirty} onClick={cancel} priority="secondary">
            <FormattedMessage defaultMessage="Annuler les changements" />
          </Button>
          <Button disabled={isSaving || !isDirty} onClick={() => void save()}>
            {isSaving ? (
              <FormattedMessage defaultMessage="Enregistrement..." />
            ) : (
              <FormattedMessage defaultMessage="Enregistrer les changements" />
            )}
          </Button>
        </>
      }
      breadcrumb={<PresentationBreadcrumb />}
      notices={
        <div role="status">
          <AlertBanner
            className="justify-center px-4 py-3 text-center"
            icon="fr-icon-info-fill"
            message={
              <FormattedMessage defaultMessage="Vos changements apparaissent dans l'aperçu au moment de l'enregistrement." />
            }
            tone="info"
          />
        </div>
      }
      title={<FormattedMessage defaultMessage="Texte de la notice de restitution" />}
      tone="alt"
    >
      {isPending || !html ? (
        <i className="ri-loader-4-line m-auto animate-spin text-[2rem]" />
      ) : (
        <>
          <DocumentViewer
            className="hidden border-0 md:block md:flex-1 xl:flex-3"
            html={html}
            reloadKey={reloadKey}
            title={title}
          />
          <div className="flex max-h-[calc(100svh-var(--document-bar-offset)-6rem)] min-w-0 flex-1 flex-col overflow-auto xl:flex-4">
            <DocumentHtmlEditor
              html={html}
              key={editorKey}
              onHtmlChange={onDraftChange}
              onPreview={() => void navigate(previewPath)}
              previewDisabledReason={
                isDirty
                  ? formatMessage({ defaultMessage: "Enregistrez vos changements pour accéder à l'aperçu" })
                  : undefined
              }
              title={title}
            />
          </div>
        </>
      )}
    </DocumentScreen>
  );
}
