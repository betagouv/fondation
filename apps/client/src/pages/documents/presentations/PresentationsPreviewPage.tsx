import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, Link, useNavigate, useParams } from 'react-router';

import { DocumentDraftBanner } from '../DocumentDraftBanner';
import { DocumentScreen } from '@/features/documents/components/DocumentScreen';
import { DocumentViewer } from '@/features/documents/components/DocumentViewer';
import { PresentationBreadcrumb } from '@/features/documents/components/presentations/PresentationBreadcrumb';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  useJusticePresentationPlanHtmlQuery,
  useJusticePresentationPlanMetadataQuery,
  useJusticePresentationPlanPdfMutation,
} from '@queries/agenda.queries';

import { PresentationDriftBanner } from './PresentationDriftBanner';

export function PresentationPreviewPage() {
  const { formatMessage } = useIntl();
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

  const { data: html, isPending } = useJusticePresentationPlanHtmlQuery({ presentationPlanId: planId });
  const { data: metadata } = useJusticePresentationPlanMetadataQuery({ presentationPlanId: planId });
  const generatePdf = useJusticePresentationPlanPdfMutation({
    planId: planId!,
    force: false,
    onSuccess: () => navigate(generatePath(ROUTE_PATHS.SG.PRESENTATIONS_READY)),
  });
  const isValidating = generatePdf.isPending;
  const title = formatMessage({ defaultMessage: 'Notice de restitution' });

  return (
    <DocumentScreen
      actions={
        !isPending &&
        html &&
        !metadata?.isPresented && (
          <>
            <Button
              linkProps={{
                to: generatePath(ROUTE_PATHS.SG.PRESENTATIONS_UPDATE, { planId: planId! }),
              }}
              priority="secondary"
            >
              <FormattedMessage defaultMessage="Modifier les informations" />
            </Button>
            <Button
              linkProps={{ to: generatePath(ROUTE_PATHS.SG.PRESENTATIONS_EDIT, { planId: planId! }) }}
              priority="secondary"
            >
              <FormattedMessage defaultMessage="Éditer le texte" />
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
      }
      backLink={
        <Link
          className="fr-link fr-link--icon-left fr-icon-arrow-left-line"
          to={generatePath(ROUTE_PATHS.SG.PRESENTATIONS_READY)}
        >
          <FormattedMessage defaultMessage="Fermer" />
        </Link>
      }
      breadcrumb={<PresentationBreadcrumb />}
      notices={
        /** @warning the live region is always rendered: a screen reader ignores one that appears already filled */
        <div role="status">
          {metadata?.status === 'DRAFT' && <DocumentDraftBanner hasValidatedVersion={false} />}
          {metadata?.outdated && (
            <PresentationDriftBanner
              editionPath={
                metadata.isPresented
                  ? undefined
                  : generatePath(ROUTE_PATHS.SG.PRESENTATIONS_UPDATE, { planId: planId! })
              }
            />
          )}
        </div>
      }
      title={title}
      tone="alt"
    >
      {isPending || !html ? (
        <i className="ri-loader-4-line m-auto animate-spin text-[2rem]" />
      ) : (
        <DocumentViewer className="mx-auto w-full max-w-4xl border-0" html={html} title={title} />
      )}
    </DocumentScreen>
  );
}
