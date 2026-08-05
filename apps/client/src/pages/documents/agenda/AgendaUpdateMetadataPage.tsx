import Alert from '@codegouvfr/react-dsfr/Alert';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { AgendaBreadCrumb } from '@/features/agenda/components/AgendaBreadcrumb';
import { AgendaMetadataForm } from '@/features/agenda/components/AgendaMetadataForm';
import type { AgendaMetadata } from '@/features/agenda/context/AgendaContext.types';
import { HttpException } from '@/utils/http-exception';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useDetailsAgendaMetadataQuery, useUpdateAgendaMetadataMutation } from '@queries/agenda.queries';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

export function AgendaUpdateMetadataPage() {
  const { formatMessage } = useIntl();
  const { sessionId = '', agendaId = '' } = useParams<{ sessionId: string; agendaId: string }>();
  const navigate = useNavigate();

  const [error, setError] = React.useState<string | null>(null);

  const { data: session } = useDetailedNominationSessionQuery({ sessionId });
  const { data: metadata, isFetching } = useDetailsAgendaMetadataQuery({ agendaId });
  const update = useUpdateAgendaMetadataMutation(sessionId, agendaId);

  const onSubmit = React.useCallback(
    (values: AgendaMetadata) => {
      update.mutate(values, {
        onSuccess: () => navigate(generatePath(ROUTE_PATHS.SG.AGENDA_PREVIEW, { sessionId, agendaId })),
        onError: async (err) => {
          const defaultError = formatMessage({
            defaultMessage: `Impossible de mettre à jour les métadonnées`,
          });
          if (err instanceof HttpException) {
            const body = await err.response.json();
            setError(body.validationError || defaultError);
          } else {
            setError(defaultError);
          }
        },
      });
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
        <FormattedMessage defaultMessage="Métadonnées de l'ordre du jour" />
      </h1>
      {isFetching ? (
        <span className="ri-loader-4-line animate-spin" />
      ) : (
        <AgendaMetadataForm
          formation={session?.formation ?? 'SIEGE'}
          defaultValues={metadata}
          isSubmitting={update.isPending}
          submitLabel={<FormattedMessage defaultMessage="Enregistrer les métadonnées" />}
          submitIconId="ri-save-line"
          cancelLabel={<FormattedMessage defaultMessage="Annuler" />}
          onCancel={onCancel}
          onSubmit={onSubmit}
        />
      )}
    </div>
  );
}
