import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { AgendaDocumentEditor } from '@/features/documents/components/agenda/editor';
import { DocumentScreen } from '@/features/documents/components/DocumentScreen';
import { useDocumentFailure } from '@/shared/hooks/useDocumentFailure';
import { AlertBanner } from '@/shared/ui/alert-banner';
import { Breadcrumb } from '@/shared/ui/Breadcrumb';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useAgendaDocumentBlocksQuery, useGenerateAgendaPdfMutation } from '@queries/agenda.queries';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

export function AgendaPreviewPage() {
  const navigate = useNavigate();
  const describeFailure = useDocumentFailure();

  const { agendaId, sessionId } = useParams<{ agendaId: string; sessionId: string }>();

  const { data: session } = useDetailedNominationSessionQuery({ sessionId });
  const { data: document, isFetchedAfterMount } = useAgendaDocumentBlocksQuery({ id: agendaId });

  const generatePdf = useGenerateAgendaPdfMutation({
    force: true,
    sessionId: sessionId!,
    agendaId: agendaId!,
    onSuccess: () => navigate(generatePath(ROUTE_PATHS.SG.SESSION_ID_DOCUMENTS, { sessionId: sessionId! })),
  });

  const [hasPendingRevalidation, setHasPendingRevalidation] = useState(false);

  return (
    <DocumentScreen
      actions={
        <>
          <Button
            iconId="ri-file-list-3-line"
            linkProps={{
              to: generatePath(ROUTE_PATHS.SG.AGENDA_UPDATE_FILES, {
                agendaId: agendaId!,
                sessionId: sessionId!,
              }),
            }}
            priority="secondary"
          >
            <FormattedMessage defaultMessage="Propositions" />
          </Button>
          <Button
            iconId="ri-calendar-event-line"
            linkProps={{
              to: generatePath(ROUTE_PATHS.SG.AGENDA_UPDATE_METADATA, {
                agendaId: agendaId!,
                sessionId: sessionId!,
              }),
            }}
            priority="secondary"
          >
            <FormattedMessage defaultMessage="Métadonnées" />
          </Button>
          <Button
            className={clsx({ 'after:animate-spin': generatePdf.isPending })}
            disabled={generatePdf.isPending || hasPendingRevalidation}
            iconId={generatePdf.isPending ? 'ri-loader-4-line' : 'fr-icon-success-fill'}
            iconPosition="right"
            onClick={() => generatePdf.mutate()}
          >
            {generatePdf.isPending ? (
              <FormattedMessage defaultMessage="Génération en cours..." />
            ) : (
              <FormattedMessage defaultMessage="Valider le document" />
            )}
          </Button>
        </>
      }
      breadcrumb={
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
      }
      notices={
        <>
          {/** @warning the live region is always rendered: a screen reader ignores one that appears already filled */}
          <div role="status">
            {hasPendingRevalidation && (
              <AlertBanner
                className="fr-mt-4v px-4 py-3"
                icon="fr-icon-warning-fill"
                message={
                  <FormattedMessage defaultMessage="Certains dossiers ont changé et doivent être validés" />
                }
                tone="warning"
              />
            )}
          </div>
          <div role="alert">
            {generatePdf.isError && (
              <AlertBanner
                className="fr-mt-4v px-4 py-3"
                icon="fr-icon-error-fill"
                message={describeFailure(generatePdf.error)}
                tone="error"
              />
            )}
          </div>
        </>
      }
      title={<FormattedMessage defaultMessage="Ordre du jour" />}
    >
      {!isFetchedAfterMount || !agendaId || !document ? (
        <i className="ri-loader-4-line m-auto animate-spin text-[2rem]" />
      ) : (
        <AgendaDocumentEditor
          key={agendaId}
          sessionId={sessionId!}
          agendaId={agendaId}
          blocks={document.blocks}
          onPendingRevalidationChange={setHasPendingRevalidation}
        />
      )}
    </DocumentScreen>
  );
}
