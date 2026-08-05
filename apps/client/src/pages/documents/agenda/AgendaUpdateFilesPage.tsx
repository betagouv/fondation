import Alert from '@codegouvfr/react-dsfr/Alert';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { AgendaBreadCrumb } from '@/features/agenda/components/AgendaBreadcrumb';
import { AgendaFilesSelection } from '@/features/agenda/components/AgendaFilesSelection';
import { HttpException } from '@/utils/http-exception';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useDetailsAgendaFilesQuery, useUpdateAgendaFilesMutation } from '@queries/agenda.queries';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

export function AgendaUpdateFilesPage() {
  const { formatMessage } = useIntl();
  const { sessionId = '', agendaId = '' } = useParams<{ sessionId: string; agendaId: string }>();
  const navigate = useNavigate();

  const [error, setError] = React.useState<string | null>(null);

  const { data: session } = useDetailedNominationSessionQuery({ sessionId });
  const { data: files, isFetching } = useDetailsAgendaFilesQuery({ agendaId });
  const update = useUpdateAgendaFilesMutation(sessionId, agendaId);

  const onSubmit = React.useCallback(
    (nominationFileIds: readonly string[]) => {
      update.mutate(
        { nominationFileIds: [...nominationFileIds] },
        {
          onSuccess: () => navigate(generatePath(ROUTE_PATHS.SG.AGENDA_PREVIEW, { sessionId, agendaId })),
          onError: async (err) => {
            const defaultError = formatMessage({
              defaultMessage: `Impossible de mettre à jour les propositions`,
            });
            if (err instanceof HttpException) {
              const body = await err.response.json();
              setError(body.validationError || defaultError);
            } else {
              setError(defaultError);
            }
          },
        },
      );
    },
    [update, navigate, sessionId, agendaId, formatMessage],
  );

  const onCancel = React.useCallback(
    () => navigate(generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId })),
    [navigate, sessionId],
  );

  return (
    <div className="fr-container fr-py-4v">
      <AgendaBreadCrumb />
      {error && <Alert className="fr-mb-6v" title={error} as="h2" severity="error" closable />}
      <h1>
        <FormattedMessage defaultMessage="Propositions de l'ordre du jour" />
      </h1>
      {isFetching ? (
        <span className="ri-loader-4-line animate-spin" />
      ) : (
        <AgendaFilesSelection
          sessionId={sessionId}
          formation={session?.formation ?? 'SIEGE'}
          defaultSelectedFileIds={files?.items}
          isSubmitting={update.isPending}
          cancelLabel={<FormattedMessage defaultMessage="Annuler" />}
          onCancel={onCancel}
          onSubmit={onSubmit}
          renderSubmitLabel={(count) => (
            <FormattedMessage
              values={{ count }}
              defaultMessage={`{count, plural,
                =0 {En attente de sélection}
                other {Enregistrer les propositions}}`}
            />
          )}
        />
      )}
    </div>
  );
}
