import Button from '@codegouvfr/react-dsfr/Button';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, Link, useNavigate, useParams } from 'react-router';

import { DocumentDraftBanner } from '../DocumentDraftBanner';
import { DocumentDriftBanner } from '../DocumentDriftBanner';
import { DocumentValidatedBanner } from '../DocumentValidatedBanner';
import { DocumentScreen } from '@/features/documents/components/DocumentScreen';
import { DocumentViewer } from '@/features/documents/components/DocumentViewer';
import { OfficialReportBreadCrumb } from '@/features/documents/components/official-report/OfficialReportBreadCrumb';
import { useConfirmModal } from '@/shared/context/confirm-modal';
import { useDateAndTime } from '@/shared/hooks/useDateAndTime';
import { useDocumentFailure } from '@/shared/hooks/useDocumentFailure';
import { AlertBanner } from '@/shared/ui/alert-banner';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  useDetailsOfficialReportQuery,
  useDiscardOfficialReportDraftMutation,
  useOfficialReportHtmlQuery,
  useValidateOfficialReportMutation,
} from '@queries/agenda.queries';

export function OfficialReportPreviewPage() {
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
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

  const title = formatMessage({ defaultMessage: 'PV de restitution' });
  const isDraft = metadata?.status === 'DRAFT';
  const confirmation = useConfirmModal();
  const dateAndTime = useDateAndTime();

  const revertToValidated = async () => {
    const validatedAt = metadata?.validation?.at;
    const { isConfirmed } = await confirmation.waitForConfirmation({
      content: (
        <p>
          <FormattedMessage defaultMessage="Les modifications faites depuis seront perdues." />
        </p>
      ),
      i18n: { confirm: formatMessage({ defaultMessage: 'Revenir à cette version' }) },
      title: validatedAt
        ? formatMessage(
            { defaultMessage: 'Revenir à la version validée le {date} à {time} ?' },
            dateAndTime(validatedAt),
          )
        : formatMessage({ defaultMessage: 'Revenir à la version validée ?' }),
    });

    if (isConfirmed) discardDraft.mutate();
  };

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
            <FormattedMessage defaultMessage="Modifier les données" />
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
          {/* what the application brought in is taken without asking: only a person's draft is theirs to drop */}
          {isDraft && metadata.hasValidatedVersion && metadata.draftChangesBy === 'PERSON' && (
            <Button disabled={isBusy} onClick={() => void revertToValidated()} priority="secondary">
              <FormattedMessage defaultMessage="Revenir à la version validée" />
            </Button>
          )}
          {isDraft && (
            <Button disabled={isBusy} onClick={() => validate.mutate()}>
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
            {metadata?.status === 'VALIDATED' && metadata.validation && (
              <DocumentValidatedBanner kind="officialReport" validation={metadata.validation} />
            )}
            {isDraft && (
              <DocumentDraftBanner
                draft={metadata.draft}
                hasValidatedVersion={metadata.hasValidatedVersion}
                validatedAt={metadata.validation?.at}
                kind="officialReport"
              />
            )}
            {metadata?.outdated && (
              <DocumentDriftBanner
                editionPath={generatePath(ROUTE_PATHS.SG.OFFICIAL_REPORT_EDIT, {
                  officialReportId: officialReportId!,
                  sessionId: sessionId!,
                })}
                outdatedPropositions={metadata.outdatedPropositions}
              />
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
