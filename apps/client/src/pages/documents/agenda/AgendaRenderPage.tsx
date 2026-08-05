import Button from '@codegouvfr/react-dsfr/Button';
import { useIntl } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { DocumentIframe } from '@/shared/ui/document-preview/DocumentIframe';
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
    <div className="flex min-h-svh flex-col bg-(--background-alt-grey)">
      <div className="fr-py-2v sticky top-0 border-x-0 border-t-0 border-b border-solid border-(--border-default-grey) bg-(--background-default-grey)">
        <div className="fr-container flex items-center justify-between">
          <h1 className="fr-mb-0 fr-text--lg">{title}</h1>
          <Button
            priority="tertiary"
            size="small"
            iconId="fr-icon-close-line"
            iconPosition="right"
            disabled={closePreview.isPending}
            onClick={onClose}
          >
            {$t({ defaultMessage: "Fermer l'aperçu" })}
          </Button>
        </div>
      </div>

      {isPending || !html ? (
        <i className="ri-loader-4-line m-auto animate-spin text-[2rem]" />
      ) : (
        <DocumentIframe html={html} title={title} autoHeight className="mx-auto w-full max-w-4xl border-0" />
      )}
    </div>
  );
}
