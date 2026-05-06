import React from 'react';
import { useIntl } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { DocumentPreviewLayout } from '@/components/secretariat-general/document-preview/DocumentPreview';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useGenerateOfficialReportPdfMutation, useOfficialReportHtmlQuery } from '@queries/agenda.queries';

export function OfficialReportPreviewPage() {
  const { $t } = useIntl();
  const { officialReportId, sessionId } = useParams<{
    officialReportId: string;
    sessionId: string;
  }>();
  const navigate = useNavigate();

  const { data: html, isPending } = useOfficialReportHtmlQuery({
    id: officialReportId,
    force: true,
  });
  const generatePdf = useGenerateOfficialReportPdfMutation();

  const onValidate = React.useCallback(() => {
    generatePdf.mutate(
      { officialReportId: officialReportId!, sessionId: sessionId! },
      {
        onSuccess: () => navigate(generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId: sessionId! })),
      },
    );
  }, [officialReportId, sessionId, generatePdf, navigate]);

  const title = $t({ defaultMessage: `PV de restitution` });
  return (
    <DocumentPreviewLayout
      html={html}
      title={title}
      isPending={isPending}
      onValidate={onValidate}
      isValidating={generatePdf.isPending}
    />
  );
}
