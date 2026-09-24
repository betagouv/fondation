import Button from '@codegouvfr/react-dsfr/Button';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, Link, useLocation, useNavigate, useParams } from 'react-router';

import { DocumentDraftBanner } from '../DocumentDraftBanner';
import { DocumentValidatedBanner } from '../DocumentValidatedBanner';
import { AgendaBreadCrumb } from '@/features/documents/components/agenda/AgendaBreadcrumb';
import { DocumentScreen } from '@/features/documents/components/DocumentScreen';
import { DocumentViewer } from '@/features/documents/components/DocumentViewer';
import { useConfirmModal } from '@/shared/context/confirm-modal';
import { useDateAndTime } from '@/shared/hooks/useDateAndTime';
import { useDocumentFailure } from '@/shared/hooks/useDocumentFailure';
import { AlertBanner } from '@/shared/ui/alert-banner';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  useAgendaHtmlQuery,
  useDetailsAgendaMetadataQuery,
  useDiscardAgendaDraftMutation,
  useValidateAgendaMutation,
} from '@queries/agenda.queries';

import { AgendaReportersChangedBanner } from './AgendaReportersChangedBanner';

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
  const confirmation = useConfirmModal();
  const dateAndTime = useDateAndTime();

  const revertToValidated = async () => {
    const validatedAt = metadata?.validation?.at;
    const { isConfirmed } = await confirmation.waitForConfirmation({
      content: (
        <p>
          <FormattedMessage defaultMessage="Les modifications faites depuis seront perdues." />
        </p>
      ),
      i18n: { confirm: formatMessage({ defaultMessage: 'Revenir à cette version' }) },
      title: validatedAt
        ? formatMessage(
            { defaultMessage: 'Revenir à la version validée le {date} à {time} ?' },
            dateAndTime(validatedAt),
          )
        : formatMessage({ defaultMessage: 'Revenir à la version validée ?' }),
    });

    if (isConfirmed) discardDraft.mutate();
  };

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
            <FormattedMessage defaultMessage="Modifier les données" />
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
          {/* what the application brought in is taken without asking: only a person's draft is theirs to drop */}
          {isDraft && metadata.hasValidatedVersion && metadata.draftChangesBy === 'PERSON' && (
            <Button disabled={isBusy} onClick={() => void revertToValidated()} priority="secondary">
              <FormattedMessage defaultMessage="Revenir à la version validée" />
            </Button>
          )}
          {isDraft && (
            <Button disabled={isBusy} onClick={() => validate.mutate()}>
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
            {metadata?.status === 'VALIDATED' && metadata.validation && (
              <DocumentValidatedBanner kind="agenda" validation={metadata.validation} />
            )}
            {isDraft && (
              <DocumentDraftBanner
                draft={metadata.draft}
                hasValidatedVersion={metadata.hasValidatedVersion}
                kind="agenda"
                validatedAt={metadata.validation?.at}
              />
            )}
            {metadata?.outdated && (
              <AgendaReportersChangedBanner
                editionPath={generatePath(ROUTE_PATHS.SG.AGENDA_EDIT, {
                  agendaId: agendaId!,
                  sessionId: sessionId!,
                })}
                propositions={metadata.outdatedPropositions}
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
