import Alert from '@codegouvfr/react-dsfr/Alert';
import { useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { AgendaBreadCrumb } from '@/features/documents/components/agenda/AgendaBreadcrumb';
import { AgendaFilesSelectionTable } from '@/features/documents/components/agenda/AgendaFilesSelectionTable';
import { HttpException } from '@/utils/http-exception';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useDetailsAgendaFilesQuery, useUpdateAgendaFilesMutation } from '@queries/agenda.queries';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

export function AgendaUpdateFilesPage() {
  const { formatMessage } = useIntl();
  const { sessionId = '', agendaId = '' } = useParams<{ sessionId: string; agendaId: string }>();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);
  const [actionsSlot, setActionsSlot] = useState<HTMLDivElement | null>(null);

  const { data: session } = useDetailedNominationSessionQuery({ sessionId });
  const { data: files, isFetching } = useDetailsAgendaFilesQuery({ agendaId });
  const update = useUpdateAgendaFilesMutation(sessionId, agendaId);

  const onSubmit = useCallback(
    (nominationFileIds: readonly string[]) => {
      update.mutate(
        { nominationFileIds: [...nominationFileIds] },
        {
          onError: async (err) => {
            const defaultError = formatMessage({
              defaultMessage: `Impossible de mettre à jour les propositions`,
            });
            if (err instanceof HttpException) {
              const body = await err.response.json().catch(() => null);
              setError(body?.validationError || defaultError);
            } else {
              setError(defaultError);
            }
          },
          onSuccess: () => navigate(generatePath(ROUTE_PATHS.SG.AGENDA_PREVIEW, { agendaId, sessionId })),
        },
      );
    },
    [agendaId, formatMessage, navigate, sessionId, update],
  );

  const onCancel = useCallback(
    () => navigate(generatePath(ROUTE_PATHS.SG.AGENDA_PREVIEW, { agendaId, sessionId })),
    [agendaId, navigate, sessionId],
  );

  return (
    <div className="fr-container fr-py-4v">
      <AgendaBreadCrumb />
      {error && <Alert as="h2" className="fr-mb-6v" closable severity="error" title={error} />}
      <div className="fr-mb-4v flex flex-wrap items-center justify-between gap-4">
        <h1 className="fr-m-0">
          <FormattedMessage defaultMessage="Propositions de l'ordre du jour" />
        </h1>
        <div className="flex justify-end" ref={setActionsSlot} />
      </div>
      {isFetching ? (
        <span className="ri-loader-4-line animate-spin" />
      ) : (
        <AgendaFilesSelectionTable
          actionsSlot={actionsSlot}
          cancelLabel={<FormattedMessage defaultMessage="Annuler" />}
          defaultSelectedFileIds={files?.items}
          formation={session?.formation ?? 'SIEGE'}
          isSubmitting={update.isPending}
          onCancel={onCancel}
          onSubmit={onSubmit}
          outcomes={session?.outcomes ?? []}
          renderSubmitLabel={(count) => (
            <FormattedMessage
              defaultMessage={`{count, plural,
                =0 {En attente de sélection}
                other {Enregistrer les propositions}}`}
              values={{ count }}
            />
          )}
          sessionId={sessionId}
        />
      )}
    </div>
  );
}
