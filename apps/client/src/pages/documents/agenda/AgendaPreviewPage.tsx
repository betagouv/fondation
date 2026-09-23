import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, Link, useLocation, useNavigate, useParams } from 'react-router';

import { DocumentDraftBanner } from '../DocumentDraftBanner';
import { DocumentDriftBanner } from '../DocumentDriftBanner';
import { AgendaBreadCrumb } from '@/features/documents/components/agenda/AgendaBreadcrumb';
import { DocumentScreen } from '@/features/documents/components/DocumentScreen';
import { DocumentViewer } from '@/features/documents/components/DocumentViewer';
import { useDocumentFailure } from '@/shared/hooks/useDocumentFailure';
import { AlertBanner, AlertBannerAction } from '@/shared/ui/alert-banner';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  useAgendaHtmlQuery,
  useDetailsAgendaMetadataQuery,
  useDiscardAgendaDraftMutation,
  useValidateAgendaMutation,
} from '@queries/agenda.queries';

export function AgendaPreviewPage() {
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const describeFailure = useDocumentFailure();

  const { agendaId, sessionId } = useParams<{ agendaId: string; sessionId: string }>();
  const { state } = useLocation();
  const returnPath: string =
    typeof state?.returnPath === 'string'
      ? state.returnPath
      : generatePath(ROUTE_PATHS.SG.SESSION_ID_DOCUMENTS, { sessionId: sessionId! });

  const { data: html, isPending } = useAgendaHtmlQuery({ force: false, id: agendaId });
  const { data: metadata } = useDetailsAgendaMetadataQuery({ agendaId });

  const validate = useValidateAgendaMutation({
    agendaId: agendaId!,
    onSuccess: () => navigate(returnPath),
    sessionId: sessionId!,
  });

  const discardDraft = useDiscardAgendaDraftMutation({
    agendaId: agendaId!,
    sessionId: sessionId!,
  });

  const title = formatMessage({ defaultMessage: 'Ordre du jour' });
  const isDraft = metadata?.status === 'DRAFT';
  const isBusy = validate.isPending || discardDraft.isPending;

  return (
    <DocumentScreen
      actions={
        <>
          <Button
            linkProps={{
              to: generatePath(ROUTE_PATHS.SG.AGENDA_UPDATE_METADATA, {
                agendaId: agendaId!,
                sessionId: sessionId!,
              }),
            }}
            priority="secondary"
          >
            <FormattedMessage defaultMessage="Modifier les informations" />
          </Button>
          <Button
            linkProps={{
              to: generatePath(ROUTE_PATHS.SG.AGENDA_UPDATE_FILES, {
                agendaId: agendaId!,
                sessionId: sessionId!,
              }),
            }}
            priority="secondary"
          >
            <FormattedMessage defaultMessage="Modifier les propositions" />
          </Button>
          <Button
            linkProps={{
              to: generatePath(ROUTE_PATHS.SG.AGENDA_EDIT, {
                agendaId: agendaId!,
                sessionId: sessionId!,
              }),
            }}
            priority="secondary"
          >
            <FormattedMessage defaultMessage="Éditer le texte" />
          </Button>
          {isDraft && (
            <Button
              className={clsx({ 'after:animate-spin': validate.isPending })}
              disabled={isBusy}
              iconId={validate.isPending ? 'ri-loader-4-line' : 'fr-icon-success-fill'}
              iconPosition="right"
              onClick={() => validate.mutate()}
            >
              {validate.isPending ? (
                <FormattedMessage defaultMessage="Validation en cours..." />
              ) : (
                <FormattedMessage defaultMessage="Valider l'ODJ" />
              )}
            </Button>
          )}
        </>
      }
      backLink={
        <Link className="fr-link fr-link--icon-left fr-icon-arrow-left-line" to={returnPath}>
          <FormattedMessage defaultMessage="Fermer" />
        </Link>
      }
      breadcrumb={<AgendaBreadCrumb />}
      notices={
        <>
          {/** @warning the live region is always rendered: a screen reader ignores one that appears already filled */}
          <div role="status">
            {isDraft && (
              <DocumentDraftBanner hasValidatedVersion={metadata.hasValidatedVersion}>
                {metadata.hasValidatedVersion && (
                  <AlertBannerAction disabled={isBusy} onClick={() => discardDraft.mutate()}>
                    <FormattedMessage defaultMessage="Revenir au document validé" />
                  </AlertBannerAction>
                )}
              </DocumentDraftBanner>
            )}
            {metadata?.outdated && (
              <DocumentDriftBanner
                editionPath={generatePath(ROUTE_PATHS.SG.AGENDA_EDIT, {
                  agendaId: agendaId!,
                  sessionId: sessionId!,
                })}
                outdatedPropositions={metadata.outdatedPropositions}
              />
            )}
          </div>
          <div role="alert">
            {(validate.isError || discardDraft.isError) && (
              <AlertBanner
                className="justify-center px-4 py-3"
                icon="fr-icon-error-fill"
                message={describeFailure(validate.error ?? discardDraft.error)}
                tone="error"
              />
            )}
          </div>
        </>
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
