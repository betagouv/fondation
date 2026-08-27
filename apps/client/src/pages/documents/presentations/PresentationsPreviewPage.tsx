import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import { useCallback, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { DocumentHtmlEditor } from '@/features/documents/components/DocumentHtmlEditor';
import { DocumentScreen } from '@/features/documents/components/DocumentScreen';
import type { DocumentViewerHandle } from '@/features/documents/components/DocumentViewer';
import { DocumentViewer } from '@/features/documents/components/DocumentViewer';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  useJusticePresentationPlanHtmlQuery,
  useJusticePresentationPlanPdfMutation,
  useUpdatePresentationPlanHtmlMutation,
} from '@queries/agenda.queries';

export function PresentationPreviewPage() {
  const { formatMessage } = useIntl();
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

  const { data: html, isPending } = useJusticePresentationPlanHtmlQuery({ presentationPlanId: planId });
  const generatePdf = useJusticePresentationPlanPdfMutation({
    planId: planId!,
    force: false,
    onSuccess: () => navigate(generatePath(ROUTE_PATHS.SG.PRESENTATIONS_READY)),
  });
  const updateHtml = useUpdatePresentationPlanHtmlMutation(planId!);

  const viewerRef = useRef<DocumentViewerHandle>(null);
  const [reloadKey, setReloadKey] = useState(() => crypto.randomUUID());

  const [isEditing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);

  const cancel = useCallback(() => {
    setEditing(false);
    setDraft(null);
    setReloadKey(crypto.randomUUID());
  }, []);

  const onDraftChange = useCallback((next: string) => {
    setDraft(next);
    viewerRef.current?.updateContent(next);
  }, []);

  const saveDraft = () => (draft ? updateHtml.mutate({ html: draft }, { onSuccess: cancel }) : cancel());

  const isSaving = updateHtml.isPending;
  const isValidating = isSaving || generatePdf.isPending;
  const title = formatMessage({ defaultMessage: 'Notice de restitution' });

  return (
    <DocumentScreen
      actions={
        isEditing ? (
          <>
            <Button disabled={isSaving} onClick={cancel} priority="secondary">
              <FormattedMessage defaultMessage="Annuler" />
            </Button>
            <Button
              className={clsx({ 'after:animate-spin': isSaving })}
              disabled={isSaving}
              iconId={isSaving ? 'ri-loader-4-line' : 'fr-icon-success-fill'}
              iconPosition="right"
              onClick={saveDraft}
            >
              <FormattedMessage defaultMessage="Sauvegarder" />
            </Button>
          </>
        ) : (
          !isPending &&
          html && (
            <>
              <Button
                iconId="fr-icon-edit-line"
                iconPosition="left"
                onClick={() => setEditing(true)}
                priority="secondary"
              >
                <FormattedMessage defaultMessage="Éditer" />
              </Button>
              <Button
                className={clsx({ 'after:animate-spin': isValidating })}
                disabled={isValidating}
                iconId={isValidating ? 'ri-loader-4-line' : 'fr-icon-success-fill'}
                iconPosition="right"
                onClick={() => generatePdf.mutate()}
              >
                <FormattedMessage defaultMessage="Valider le document" />
              </Button>
            </>
          )
        )
      }
      title={title}
      tone="alt"
    >
      {isPending || !html ? (
        <i className="ri-loader-4-line m-auto animate-spin text-[2rem]" />
      ) : (
        <>
          {isEditing && (
            <div className="flex min-w-0 flex-1 flex-col xl:flex-2">
              <DocumentHtmlEditor html={html} title={title} onHtmlChange={onDraftChange} />
            </div>
          )}
          <DocumentViewer
            ref={viewerRef}
            className={clsx('border-0', {
              'hidden md:block md:flex-1 xl:flex-3': isEditing,
              'mx-auto w-full max-w-4xl': !isEditing,
            })}
            html={html}
            reloadKey={reloadKey}
            title={title}
          />
        </>
      )}
    </DocumentScreen>
  );
}
