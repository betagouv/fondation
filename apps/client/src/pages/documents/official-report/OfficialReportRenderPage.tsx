import Button from '@codegouvfr/react-dsfr/Button';
import { useIntl } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { DocumentScreen } from '@/features/documents/components/DocumentScreen';
import { DocumentViewer } from '@/features/documents/components/DocumentViewer';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useOfficialReportHtmlQuery, useResetOfficialReportDocumentMutation } from '@queries/agenda.queries';

export function OfficialReportRenderPage() {
  const navigate = useNavigate();
  const { $t } = useIntl();
  const { officialReportId, sessionId } = useParams<{
    officialReportId: string;
    sessionId: string;
  }>();

  const { data: html, isPending } = useOfficialReportHtmlQuery({ id: officialReportId, force: true });
  const closePreview = useResetOfficialReportDocumentMutation(sessionId!, officialReportId!);

  const title = $t({ defaultMessage: 'PV de restitution' });

  const onClose = () =>
    closePreview.mutate(undefined, {
      onSuccess: () =>
        navigate(
          generatePath(ROUTE_PATHS.SG.OFFICIAL_REPORT_PREVIEW, {
            sessionId: sessionId!,
            officialReportId: officialReportId!,
          }),
        ),
    });

  return (
    <DocumentScreen
      actions={
        <Button
          disabled={closePreview.isPending}
          iconId="fr-icon-close-line"
          iconPosition="right"
          onClick={onClose}
          priority="tertiary"
        >
          {$t({ defaultMessage: "Fermer l'aperçu" })}
        </Button>
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
