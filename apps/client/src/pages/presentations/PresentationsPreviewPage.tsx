import { useIntl } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { DocumentPreviewLayout } from '@/shared/ui/document-preview/DocumentPreview';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  useJusticePresentationPlanHtmlQuery,
  useJusticePresentationPlanPdfMutation,
  useUpdatePresentationPlanHtmlMutation,
} from '@queries/agenda.queries';

export function PresentationPreviewPage() {
  const { formatMessage } = useIntl();
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

  const { data: html, isPending } = useJusticePresentationPlanHtmlQuery({
    presentationPlanId: planId,
  });
  const generatePdf = useJusticePresentationPlanPdfMutation({
    planId: planId!,
    force: false,
    onSuccess: () => navigate(generatePath(ROUTE_PATHS.SG.PRESENTATIONS_READY)),
  });
  const updateHtml = useUpdatePresentationPlanHtmlMutation(planId!);

  const title = formatMessage({ defaultMessage: `Notice de restitution` });
  return (
    <DocumentPreviewLayout
      html={html}
      title={title}
      isPending={isPending}
      validateMutation={generatePdf}
      updateContentMutation={updateHtml}
    />
  );
}
