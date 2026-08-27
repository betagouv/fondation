import Alert from '@codegouvfr/react-dsfr/Alert';
import { useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { AgendaBreadCrumb } from '@/features/documents/components/agenda/AgendaBreadcrumb';
import { AgendaMetadataForm } from '@/features/documents/components/agenda/AgendaMetadataForm';
import type { AgendaMetadata } from '@/features/documents/context/AgendaContext.types';
import { HttpException } from '@/utils/http-exception';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import { useDetailsAgendaMetadataQuery, useUpdateAgendaMetadataMutation } from '@queries/agenda.queries';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

export function AgendaUpdateMetadataPage() {
  const { formatMessage } = useIntl();
  const { sessionId = '', agendaId = '' } = useParams<{ sessionId: string; agendaId: string }>();
  const navigate = useNavigate();

  const [error, setError] = useState<string | null>(null);

  const { data: session } = useDetailedNominationSessionQuery({ sessionId });
  const { data: metadata, isFetching } = useDetailsAgendaMetadataQuery({ agendaId });
  const update = useUpdateAgendaMetadataMutation(sessionId, agendaId);

  const onSubmit = useCallback(
    (values: AgendaMetadata) => {
      update.mutate(values, {
        onError: async (err) => {
          const defaultError = formatMessage({
            defaultMessage: `Impossible de mettre à jour les métadonnées`,
          });
          if (err instanceof HttpException) {
            const body = await err.response.json().catch(() => null);
            setError(body?.validationError || defaultError);
          } else {
            setError(defaultError);
          }
        },
        onSuccess: () => navigate(generatePath(ROUTE_PATHS.SG.AGENDA_PREVIEW, { agendaId, sessionId })),
      });
    },
    [agendaId, formatMessage, navigate, sessionId, update],
  );

  const onCancel = useCallback(
    () => navigate(generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId })),
    [navigate, sessionId],
  );

  return (
    <div className="fr-container fr-py-4v">
      <AgendaBreadCrumb />
      {error && <Alert as="h2" className="fr-mb-6v" closable severity="error" title={error} />}
      <h1>
        <FormattedMessage defaultMessage="Métadonnées de l'ordre du jour" />
      </h1>
      {isFetching ? (
        <span className="ri-loader-4-line animate-spin" />
      ) : (
        <AgendaMetadataForm
          cancelLabel={<FormattedMessage defaultMessage="Annuler" />}
          defaultValues={metadata}
          formation={session?.formation ?? 'SIEGE'}
          isSubmitting={update.isPending}
          onCancel={onCancel}
          onSubmit={onSubmit}
          submitIconId="ri-save-line"
          submitLabel={<FormattedMessage defaultMessage="Enregistrer les métadonnées" />}
        />
      )}
    </div>
  );
}
