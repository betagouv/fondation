import Button from '@codegouvfr/react-dsfr/Button';
import { useIntl } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { DocumentScreen } from '@/features/documents/components/DocumentScreen';
import { DocumentViewer } from '@/features/documents/components/DocumentViewer';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useAgendaHtmlQuery, useResetAgendaDocumentMutation } from '@queries/agenda.queries';

export function AgendaRenderPage() {
  const navigate = useNavigate();
  const { $t } = useIntl();
  const { agendaId, sessionId } = useParams<{ agendaId: string; sessionId: string }>();

  const { data: html, isPending } = useAgendaHtmlQuery({ id: agendaId, force: true });
  const closePreview = useResetAgendaDocumentMutation(agendaId!);

  const title = $t({ defaultMessage: 'Ordre du jour' });

  const onClose = () =>
    closePreview.mutate(undefined, {
      onSuccess: () =>
        navigate(
          generatePath(ROUTE_PATHS.SG.AGENDA_PREVIEW, {
            sessionId: sessionId!,
            agendaId: agendaId!,
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
