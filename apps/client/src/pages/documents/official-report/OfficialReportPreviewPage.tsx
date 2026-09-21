import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, Link, useNavigate, useParams } from 'react-router';

import { DocumentDraftBanner } from '../DocumentDraftBanner';
import { DocumentScreen } from '@/features/documents/components/DocumentScreen';
import { DocumentViewer } from '@/features/documents/components/DocumentViewer';
import { OfficialReportBreadCrumb } from '@/features/documents/components/official-report/OfficialReportBreadCrumb';
import { useDocumentFailure } from '@/shared/hooks/useDocumentFailure';
import { AlertBanner, AlertBannerAction } from '@/shared/ui/alert-banner';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  useDetailsOfficialReportQuery,
  useDiscardOfficialReportDraftMutation,
  useOfficialReportHtmlQuery,
  useValidateOfficialReportMutation,
} from '@queries/agenda.queries';

export function OfficialReportPreviewPage() {
  const navigate = useNavigate();
  const { $t } = useIntl();
  const describeFailure = useDocumentFailure();

  const { officialReportId, sessionId } = useParams<{ officialReportId: string; sessionId: string }>();

  const { data: html, isPending } = useOfficialReportHtmlQuery({ force: false, id: officialReportId });
  const { data: metadata } = useDetailsOfficialReportQuery({ officialReportId });

  const validate = useValidateOfficialReportMutation({
    officialReportId: officialReportId!,
    onSuccess: () => navigate(generatePath(ROUTE_PATHS.SG.SESSION_ID_DOCUMENTS, { sessionId: sessionId! })),
    sessionId: sessionId!,
  });

  const discardDraft = useDiscardOfficialReportDraftMutation({
    officialReportId: officialReportId!,
    sessionId: sessionId!,
  });

  const title = $t({ defaultMessage: 'PV de restitution' });
  const isDraft = metadata?.status === 'DRAFT';
  const isBusy = validate.isPending || discardDraft.isPending;

  return (
    <DocumentScreen
      actions={
        <>
          <Button
            linkProps={{
              to: generatePath(ROUTE_PATHS.SG.OFFICIAL_REPORT_UPDATE, {
                officialReportId: officialReportId!,
                sessionId: sessionId!,
              }),
            }}
            priority="secondary"
          >
            <FormattedMessage defaultMessage="Modifier les informations" />
          </Button>
          <Button
            linkProps={{
              to: generatePath(ROUTE_PATHS.SG.OFFICIAL_REPORT_EDIT, {
                officialReportId: officialReportId!,
                sessionId: sessionId!,
              }),
            }}
            priority="secondary"
          >
            <FormattedMessage defaultMessage="Éditer le texte" />
          </Button>
          {isDraft && (
            <Button
              className={clsx({ 'after:animate-spin': validate.isPending })}
              disabled={isBusy}
              iconId={validate.isPending ? 'ri-loader-4-line' : 'fr-icon-success-fill'}
              iconPosition="right"
              onClick={() => validate.mutate()}
            >
              {validate.isPending ? (
                <FormattedMessage defaultMessage="Validation en cours..." />
              ) : (
                <FormattedMessage defaultMessage="Valider le PV" />
              )}
            </Button>
          )}
        </>
      }
      backLink={
        <Link
          className="fr-link fr-link--icon-left fr-icon-arrow-left-line"
          to={generatePath(ROUTE_PATHS.SG.SESSION_ID_DOCUMENTS, { sessionId: sessionId! })}
        >
          <FormattedMessage defaultMessage="Fermer" />
        </Link>
      }
      breadcrumb={<OfficialReportBreadCrumb />}
      notices={
        <>
          {/** @warning the live region is always rendered: a screen reader ignores one that appears already filled */}
          <div role="status">
            {isDraft && (
              <DocumentDraftBanner hasValidatedVersion={metadata.hasValidatedVersion}>
                {metadata.hasValidatedVersion && (
                  <AlertBannerAction disabled={isBusy} onClick={() => discardDraft.mutate()}>
                    <FormattedMessage defaultMessage="Revenir au document validé" />
                  </AlertBannerAction>
                )}
              </DocumentDraftBanner>
            )}
          </div>
          <div role="alert">
            {(validate.isError || discardDraft.isError) && (
              <AlertBanner
                className="justify-center px-4 py-3"
                icon="fr-icon-error-fill"
                message={describeFailure(validate.error ?? discardDraft.error)}
                tone="error"
              />
            )}
          </div>
        </>
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
