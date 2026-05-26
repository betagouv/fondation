import { useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { useConfirmation } from '@/hooks/useConfirmation.hook';
import { ROUTE_PATHS } from '@/utils/route-path.utils';
import {
  agendaKeys,
  useCreateAgendaMutation,
  useDetailsAgendaFilesQuery,
  useDetailsAgendaMetadataQuery,
  useResetAgendaDocumentMutation,
  useUpdateAgendaMutation,
} from '@queries/agenda.queries';
import { useDetailedNominationSessionQuery } from '@queries/nomination-sessions.queries';

import { AgendaContext } from './AgendaContext';
import type { AgendaMetadata, AgendaStep } from './AgendaContext.types';

const STEPS = {
  1: { index: 1, title: 'Métadonnées', nextTitle: 'Sélection des propositions' },
  2: { index: 2, title: 'Sélection des propositions' },
} as const satisfies Record<1 | 2, AgendaStep>;

export function AgendaProvider(props: React.PropsWithChildren) {
  const { formatMessage } = useIntl();
  const { sessionId = '', agendaId = null } = useParams<{ sessionId: string; agendaId?: string }>();
  const navigate = useNavigate();
  const { waitForConfirmation } = useConfirmation();
  const queryClient = useQueryClient();

  const createAgenda = useCreateAgendaMutation();
  const resetAgenda = useResetAgendaDocumentMutation(agendaId ?? '');
  const updateAgenda = useUpdateAgendaMutation(sessionId);

  const { data: session, isFetching: sessionFetching } = useDetailedNominationSessionQuery({
    sessionId,
  });
  const {
    data: agendaMetadata,
    isFetching: agendaMetadataFetching,
    isFetched: metadataFetched,
  } = useDetailsAgendaMetadataQuery({
    agendaId,
  });

  const { data: agendaFiles, isFetching: agendaFilesFetching } = useDetailsAgendaFilesQuery({ agendaId });

  const [state, setState] = React.useState<{
    stepIndex: 1 | 2;
    metadata: AgendaMetadata | null;
    defaultFileIds: string[] | null;
  }>({
    stepIndex: 1,
    metadata: null,
    defaultFileIds: null,
  });

  React.useEffect(() => {
    setState((s) => ({ ...s, metadata: (agendaMetadata as AgendaMetadata | undefined) ?? null }));
  }, [agendaMetadata]);

  React.useEffect(() => {
    setState((s) => ({ ...s, defaultFileIds: agendaFiles?.items ?? null }));
  }, [agendaFiles]);

  const isFetching = React.useMemo(
    () =>
      sessionFetching ||
      agendaMetadataFetching ||
      agendaFilesFetching ||
      (metadataFetched && state.metadata?.chairmanId !== agendaMetadata?.chairmanId),
    [sessionFetching, agendaMetadataFetching, agendaFilesFetching, state, metadataFetched, agendaMetadata],
  );

  const goToMetadata = React.useCallback(() => setState((s) => ({ ...s, stepIndex: 1 })), [setState]);
  const goToNominationFiles = React.useCallback(
    (metadata: AgendaMetadata) => {
      setState((s) => ({ ...s, metadata, stepIndex: 2 }));
    },
    [setState],
  );

  const cancel = React.useCallback(
    () => navigate(generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId })),
    [navigate, sessionId],
  );

  const submit = React.useCallback(
    async (nominationFileIds: string[]) => {
      if (!state.metadata) {
        const { isConfirmed } = await waitForConfirmation({
          title: 'Métadonnées manquantes',
          content: 'Merci de renseigner les métadonnées avant de continuer',
          i18n: { confirm: "Retourner à l'étape 1", cancel: 'Rester sur cette étape' },
        });
        if (isConfirmed) goToMetadata();
        return;
      }

      if (agendaId) {
        const { isConfirmed } = await waitForConfirmation({
          title: formatMessage({ defaultMessage: `Supprimer l'ancienne version` }),
          i18n: { confirm: formatMessage({ defaultMessage: `Oui, écraser l'ordre du jour` }) },
          content: (
            <>
              <p>
                {agendaMetadata?.isManuallyEdited ? (
                  <FormattedMessage
                    defaultMessage={
                      `En confirmant, vous allez écraser l'ancienne version de l'ordre du jour` +
                      `sans pouvoir la récupérer`
                    }
                  />
                ) : (
                  <FormattedMessage
                    values={{ bold: (x) => <strong>{x}</strong> }}
                    defaultMessage={
                      `En confirmant, vous allez écraser l'ancienne version de l'ordre du jour,` +
                      `<bold>y compris ses éditions manuelles</bold> sans pouvoir les récupérer`
                    }
                  />
                )}
              </p>
              <p>
                <FormattedMessage defaultMessage={'Êtes-vous sûr de vouloir continuer\u00A0;?'} />
              </p>
            </>
          ),
        });

        if (!isConfirmed) return;
      }

      const payload = {
        nominationFileIds,
        chairmanId: state.metadata.chairmanId,
        date: state.metadata.date,
        sessionMeetingDate: state.metadata.sessionMeetingDate,
      };

      async function onSuccess(result: { id: string } | undefined) {
        await queryClient.invalidateQueries({
          queryKey: agendaKeys.findAgendaNominationFiles({ sessionId }),
        });

        const id = result?.id || agendaId;
        if (id) await queryClient.invalidateQueries({ queryKey: agendaKeys.agendaHtml(id) });

        return navigate(
          generatePath(ROUTE_PATHS.SG.AGENDA_PREVIEW, { sessionId, agendaId: result?.id || agendaId }),
        );
      }

      if (agendaId) {
        resetAgenda.mutate(undefined, {
          onSuccess: () => updateAgenda.mutate({ ...payload, agendaId }, { onSuccess }),
        });
      } else {
        createAgenda.mutate({ ...payload, sessionId }, { onSuccess });
      }
    },
    [
      state,
      goToMetadata,
      queryClient,
      createAgenda,
      updateAgenda,
      agendaId,
      sessionId,
      resetAgenda,
      agendaMetadata?.isManuallyEdited,
      formatMessage,
      navigate,
      waitForConfirmation,
    ],
  );

  return (
    <AgendaContext
      value={{
        agendaId,
        step: STEPS[state.stepIndex],
        session: {
          id: sessionId,
          dueDate: session?.dueDate ?? null,
          formation: session?.formation ?? 'SIEGE',
        },
        defaultFileIds: state.defaultFileIds,
        metadata: state.metadata,
        isSubmitting: createAgenda.isPending,
        goToNominationFiles,
        goToMetadata,
        submit,
        cancel,
      }}
    >
      {isFetching ? <span className="ri-loader-4-line animate-spin" /> : props.children}
    </AgendaContext>
  );
}
