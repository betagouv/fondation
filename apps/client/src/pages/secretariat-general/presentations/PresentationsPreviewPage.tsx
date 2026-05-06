import React from 'react';
import { useIntl } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { DocumentPreviewLayout } from '@/components/secretariat-general/document-preview/DocumentPreview';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  useJusticePresentationPlanHtmlQuery,
  useJusticePresentationPlanPdfMutation,
} from '@queries/agenda.queries';

export function PresentationPreviewPage() {
  const { $t } = useIntl();
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

  const { data: html, isPending } = useJusticePresentationPlanHtmlQuery({
    presentationPlanId: planId,
    force: true,
  });
  const generatePdf = useJusticePresentationPlanPdfMutation();

  const onValidate = React.useCallback(() => {
    if (!planId) return;

    generatePdf.mutate(
      { presentationPlanId: planId },
      { onSuccess: () => navigate(generatePath(ROUTE_PATHS.SG.PRESENTATIONS_READY)) },
    );
  }, [generatePdf, planId, navigate]);

  const title = $t({ defaultMessage: `Notice de restitution` });
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
