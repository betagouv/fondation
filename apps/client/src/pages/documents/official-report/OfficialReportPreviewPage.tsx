import Button from '@codegouvfr/react-dsfr/Button';
import { FormattedMessage } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { OfficialReportDocumentEditor } from '@/shared/ui/document-preview';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  useGenerateOfficialReportPdfMutation,
  useOfficialReportDocumentQuery,
} from '@queries/agenda.queries';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

export function OfficialReportPreviewPage() {
  const navigate = useNavigate();

  const { officialReportId, sessionId } = useParams<{
    officialReportId: string;
    sessionId: string;
  }>();

  const { data: session } = useDetailedNominationSessionQuery({ sessionId });
  const { data: document, isFetchedAfterMount } = useOfficialReportDocumentQuery({
    id: officialReportId,
  });

  const generatePdf = useGenerateOfficialReportPdfMutation({
    force: true,
    sessionId: sessionId!,
    officialReportId: officialReportId!,
    onSuccess: () => navigate(generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId: sessionId! })),
  });

  const blocks = document?.blocks ?? [];
  const hasPendingRevalidation = blocks.some((block) => block.kind === 'file' && block.outdated);

  return (
    <>
      <div className="fr-container">
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
      </div>

      <div className="fr-pt-5v mx-auto flex h-[calc(100svh-3rem)] max-w-7xl flex-col">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
          <h1 className="fr-mb-0">
            <FormattedMessage defaultMessage="PV de restitution" />
          </h1>
          <Button
            size="small"
            priority="secondary"
            iconId="ri-edit-fill"
            linkProps={{
              to: generatePath(ROUTE_PATHS.SG.OFFICIAL_REPORT_UPDATE, {
                officialReportId: officialReportId!,
                sessionId: sessionId!,
              }),
            }}
          >
            <FormattedMessage defaultMessage="Métadonnées" />
          </Button>
        </div>

        <div className="fr-mt-6v flex min-h-0 flex-1 gap-6">
          {!isFetchedAfterMount || !officialReportId || !document ? (
            <i className="ri-loader-4-line m-auto animate-spin text-[2rem]" />
          ) : (
            <OfficialReportDocumentEditor sessionId={sessionId!} model={document} />
          )}
        </div>

        <div className="fr-px-4v fr-py-6v flex flex-col items-center gap-2 bg-(--background-default-grey)">
          {hasPendingRevalidation && (
            <p className="fr-mb-0 text-(--text-default-warning)">
              <FormattedMessage defaultMessage="Certains dossiers ont changé d'issue ou de rapporteurs, et doivent être validés" />
            </p>
          )}
          <Button
            disabled={generatePdf.isPending || hasPendingRevalidation}
            iconId={generatePdf.isPending ? 'ri-loader-4-line' : 'fr-icon-success-fill'}
            iconPosition="right"
            onClick={() => generatePdf.mutate()}
          >
            <FormattedMessage defaultMessage="Valider le document" />
          </Button>
        </div>
      </div>
    </>
  );
}
