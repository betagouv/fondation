import { useIntl } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { DocumentPreviewLayout } from '@/shared/ui/document-preview';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  useGenerateOfficialReportPdfMutation,
  useOfficialReportHtmlQuery,
  useUpdateOfficialReportHtmlMutation,
} from '@queries/agenda.queries';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

export function OfficialReportPreviewPage() {
  const navigate = useNavigate();
  const { formatMessage } = useIntl();

  const { officialReportId, sessionId } = useParams<{
    officialReportId: string;
    sessionId: string;
  }>();

  const { data: session } = useDetailedNominationSessionQuery({ sessionId });

  const { data: html, isPending } = useOfficialReportHtmlQuery({
    id: officialReportId,
  });

  const updateHtml = useUpdateOfficialReportHtmlMutation(officialReportId!);
  const generatePdf = useGenerateOfficialReportPdfMutation({
    force: false,
    sessionId: sessionId!,
    officialReportId: officialReportId!,
    onSuccess: () => navigate(generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId: sessionId! })),
  });

  const title = formatMessage({ defaultMessage: `PV de restitution` });

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
      <DocumentPreviewLayout
        html={html}
        title={title}
        isPending={isPending}
        updateContentMutation={updateHtml}
        validateMutation={generatePdf}
      />
    </>
  );
}
