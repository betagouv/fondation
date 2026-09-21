import { useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { AgendaMetadataForm } from '@/features/documents/components/agenda/AgendaMetadataForm';
import { AgendaWorkScreen } from '@/features/documents/components/agenda/AgendaWorkScreen';
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
  const [actionsSlot, setActionsSlot] = useState<HTMLDivElement | null>(null);

  const { data: session } = useDetailedNominationSessionQuery({ sessionId });
  const { data: metadata, isFetching } = useDetailsAgendaMetadataQuery({ agendaId });
  const update = useUpdateAgendaMetadataMutation(sessionId, agendaId);

  const onSubmit = useCallback(
    (values: AgendaMetadata) => {
      update.mutate(values, {
        onError: async (err) => {
          const defaultError = formatMessage({
            defaultMessage: `Impossible de mettre à jour les informations de l'ordre du jour`,
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
    () => navigate(generatePath(ROUTE_PATHS.SG.AGENDA_PREVIEW, { agendaId, sessionId })),
    [agendaId, navigate, sessionId],
  );

  return (
    <AgendaWorkScreen
      actionsRef={setActionsSlot}
      error={error}
      title={
        <h1 className="fr-h3 fr-m-0">
          <FormattedMessage defaultMessage="Informations de l'ordre du jour" />
        </h1>
      }
    >
      <div className="fr-py-8v mx-[calc(50%-50vw)] grow bg-(--background-alt-grey) px-[calc(50vw-50%)]">
        {isFetching ? (
          <span className="ri-loader-4-line animate-spin" />
        ) : (
          <AgendaMetadataForm
            actionsSlot={actionsSlot}
            cancelLabel={<FormattedMessage defaultMessage="Annuler" />}
            className="fr-p-6v bg-(--background-default-grey)"
            defaultValues={metadata}
            formation={session?.formation ?? 'SIEGE'}
            isSubmitting={update.isPending}
            onCancel={onCancel}
            onSubmit={onSubmit}
            submitLabel={<FormattedMessage defaultMessage="Enregistrer" />}
          />
        )}
      </div>
    </AgendaWorkScreen>
  );
}
