import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { DocumentScreen } from '@/features/documents/components/DocumentScreen';
import { OfficialReportDocumentEditor } from '@/features/documents/components/official-report/editor/OfficialReportDocumentEditor';
import { useDocumentFailure } from '@/shared/hooks/useDocumentFailure';
import { AlertBanner } from '@/shared/ui/alert-banner';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useOfficialReportDocumentQuery, useValidateOfficialReportMutation } from '@queries/agenda.queries';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

export function OfficialReportPreviewPage() {
  const navigate = useNavigate();
  const describeFailure = useDocumentFailure();

  const { officialReportId, sessionId } = useParams<{
    officialReportId: string;
    sessionId: string;
  }>();

  const { data: session } = useDetailedNominationSessionQuery({ sessionId });
  const { data: document, isFetchedAfterMount } = useOfficialReportDocumentQuery({
    id: officialReportId,
  });

  const validate = useValidateOfficialReportMutation({
    sessionId: sessionId!,
    officialReportId: officialReportId!,
    onSuccess: () => navigate(generatePath(ROUTE_PATHS.SG.SESSION_ID_DOCUMENTS, { sessionId: sessionId! })),
  });

  const [hasPendingRevalidation, setHasPendingRevalidation] = useState(false);

  return (
    <DocumentScreen
      actions={
        <>
          <Button
            iconId="ri-edit-fill"
            linkProps={{
              to: generatePath(ROUTE_PATHS.SG.OFFICIAL_REPORT_UPDATE, {
                officialReportId: officialReportId!,
                sessionId: sessionId!,
              }),
            }}
            priority="secondary"
          >
            <FormattedMessage defaultMessage="Métadonnées" />
          </Button>
          <Button
            className={clsx({ 'after:animate-spin': validate.isPending })}
            disabled={validate.isPending || hasPendingRevalidation}
            iconId={validate.isPending ? 'ri-loader-4-line' : 'fr-icon-success-fill'}
            iconPosition="right"
            onClick={() => validate.mutate()}
          >
            {validate.isPending ? (
              <FormattedMessage defaultMessage="Validation en cours..." />
            ) : (
              <FormattedMessage defaultMessage="Valider le document" />
            )}
          </Button>
        </>
      }
      breadcrumb={
        <Breadcrumb
          id="breadcrumb"
          ariaLabel="fil d'Ariane"
          breadcrumb={{
            currentPageLabel: 'Validation du PV',
            segments: [
              { label: 'Secrétariat Général', to: generatePath(ROUTE_PATHS.SG.DASHBOARD) },
              { label: 'Gérer une session', to: generatePath(ROUTE_PATHS.SG.MANAGE_SESSION) },
              {
                label: session?.name || 'Session',
                to: generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId: sessionId! }),
              },
            ],
          }}
        />
      }
      notices={
        <>
          {/** @warning the live region is always rendered: a screen reader ignores one that appears already filled */}
          <div role="status">
            {hasPendingRevalidation && (
              <AlertBanner
                className="fr-mt-4v px-4 py-3"
                icon="fr-icon-warning-fill"
                message={
                  <FormattedMessage defaultMessage="Certains dossiers ont changé d'issue ou de rapporteurs et doivent être validés" />
                }
                tone="warning"
              />
            )}
          </div>
          <div role="alert">
            {validate.isError && (
              <AlertBanner
                className="fr-mt-4v px-4 py-3"
                icon="fr-icon-error-fill"
                message={describeFailure(validate.error)}
                tone="error"
              />
            )}
          </div>
        </>
      }
      title={<FormattedMessage defaultMessage="PV de restitution" />}
    >
      {!isFetchedAfterMount || !officialReportId || !document ? (
        <i className="ri-loader-4-line m-auto animate-spin text-[2rem]" />
      ) : (
        <OfficialReportDocumentEditor
          key={officialReportId}
          sessionId={sessionId!}
          officialReportId={officialReportId}
          blocks={document.blocks}
          onPendingRevalidationChange={setHasPendingRevalidation}
        />
      )}
    </DocumentScreen>
  );
}
