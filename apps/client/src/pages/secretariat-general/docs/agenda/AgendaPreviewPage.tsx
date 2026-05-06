import React from 'react';
import { useIntl } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { DocumentPreviewLayout } from '@/components/secretariat-general/document-preview/DocumentPreview';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useAgendaHtmlQuery, useGenerateAgendaPdfMutation } from '@queries/agenda.queries';

export function AgendaPreviewPage() {
  const { $t } = useIntl();
  const { agendaId, sessionId } = useParams<{ agendaId: string; sessionId: string }>();
  const navigate = useNavigate();

  const { data: html, isPending } = useAgendaHtmlQuery({ id: agendaId, force: true });
  const generatePdf = useGenerateAgendaPdfMutation();

  const onValidate = React.useCallback(() => {
    generatePdf.mutate(
      { sessionId: sessionId!, agendaId: agendaId! },
      {
        onSuccess: () => navigate(generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId: sessionId! })),
      },
    );
  }, [sessionId, agendaId, generatePdf, navigate]);

  const title = $t({ defaultMessage: `Ordre du jour` });
  return (
    <DocumentPreviewLayout
      title={title}
      html={html}
      isPending={isPending}
      isValidating={generatePdf.isPending}
      onValidate={onValidate}
    />
  );
}
