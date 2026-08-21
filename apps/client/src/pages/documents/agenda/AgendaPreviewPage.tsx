import Button from '@codegouvfr/react-dsfr/Button';
import clsx from 'clsx';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { AgendaDocumentEditor } from '@/features/agenda/components/agenda-editor';
import { useDocumentFailure } from '@/shared/hooks/useDocumentFailure';
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
    <>
      <div className="fr-container">
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
      </div>

      <div className="fr-pt-5v mx-auto flex h-[calc(100svh-3rem)] max-w-7xl flex-col">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
          <h1 className="fr-mb-0">
            <FormattedMessage defaultMessage="Ordre du jour" />
          </h1>
          <div className="flex items-center gap-2">
            <Button
              size="small"
              priority="secondary"
              iconId="ri-file-list-3-line"
              linkProps={{
                to: generatePath(ROUTE_PATHS.SG.AGENDA_UPDATE_FILES, {
                  agendaId: agendaId!,
                  sessionId: sessionId!,
                }),
              }}
            >
              <FormattedMessage defaultMessage="Propositions" />
            </Button>
            <Button
              size="small"
              priority="secondary"
              iconId="ri-calendar-event-line"
              linkProps={{
                to: generatePath(ROUTE_PATHS.SG.AGENDA_UPDATE_METADATA, {
                  agendaId: agendaId!,
                  sessionId: sessionId!,
                }),
              }}
            >
              <FormattedMessage defaultMessage="Métadonnées" />
            </Button>
          </div>
        </div>

        <div className="fr-mt-6v flex min-h-0 flex-1 gap-6">
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
        </div>

        <div className="fr-px-4v fr-py-6v flex flex-col items-center gap-2 bg-(--background-default-grey)">
          {hasPendingRevalidation && (
            <p className="fr-mb-0 text-(--text-default-warning)">
              <FormattedMessage defaultMessage="Certains dossiers ont changé et doivent être validés" />
            </p>
          )}
          {generatePdf.isError && (
            <p className="fr-mb-0 text-(--text-default-error)" role="alert">
              {describeFailure(generatePdf.error)}
            </p>
          )}
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
        </div>
      </div>
    </>
  );
}
