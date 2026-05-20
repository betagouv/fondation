import { useIntl } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { DocumentPreviewLayout } from '@/components/secretariat-general/document-preview/DocumentPreview';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  useAgendaHtmlQuery,
  useGenerateAgendaPdfMutation,
  useUpdateAgendaHtmlMutation,
} from '@queries/agenda.queries';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

export function AgendaPreviewPage() {
  const { $t } = useIntl();
  const { agendaId, sessionId } = useParams<{ agendaId: string; sessionId: string }>();
  const navigate = useNavigate();

  const { data: session } = useDetailedNominationSessionQuery({ sessionId });

  const { data: html, isPending } = useAgendaHtmlQuery({ id: agendaId });

  const updateHtml = useUpdateAgendaHtmlMutation(agendaId!);
  const generatePdf = useGenerateAgendaPdfMutation({
    sessionId: sessionId!,
    agendaId: agendaId!,
    force: true,
    onSuccess: () => navigate(generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId: sessionId! })),
  });

  const title = $t({ defaultMessage: `Ordre du jour` });

  return (
    <>
      <div className="fr-container pt-4">
        <Breadcrumb
          id="breadcrumb"
          ariaLabel="fil d'Ariane"
          breadcrumb={{
            currentPageLabel: "Validation de l'ordre du jour",
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
        validateMutation={generatePdf}
        updateContentMutation={updateHtml}
      />
    </>
  );
}
