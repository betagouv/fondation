import { useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { generatePath, useNavigate, useParams } from 'react-router';

import { useAgendaBasket } from '@/features/agenda/hooks/useAgendaBasket.hook';
import { useConfirmation } from '@/shared/context/confirmation';
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
  1: { index: 1, title: 'Sélection des propositions', nextTitle: 'Métadonnées' },
  2: { index: 2, title: 'Métadonnées' },
} as const satisfies Record<1 | 2, AgendaStep>;

export function AgendaProvider(props: React.PropsWithChildren) {
  const { formatMessage } = useIntl();
  const { sessionId = '', agendaId = null } = useParams<{ sessionId: string; agendaId?: string }>();
  const navigate = useNavigate();
  const { waitForConfirmation } = useConfirmation();
  const queryClient = useQueryClient();
  const basket = useAgendaBasket(sessionId);

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
    selectedFileIds: string[] | null;
    defaultFileIds: string[] | null;
  }>({
    stepIndex: 1,
    metadata: null,
    selectedFileIds: null,
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

  const goToFiles = React.useCallback(() => setState((s) => ({ ...s, stepIndex: 1 })), [setState]);
  const goToMetadata = React.useCallback(
    (selectedFileIds: readonly string[]) => {
      setState((s) => ({ ...s, selectedFileIds: [...selectedFileIds], stepIndex: 2 }));
    },
    [setState],
  );

  const cancel = React.useCallback(() => {
    if (!agendaId) basket.clear();
    navigate(generatePath(ROUTE_PATHS.SG.SESSION_ID, { sessionId }));
  }, [navigate, sessionId, agendaId, basket]);

  const submit = React.useCallback(
    async (metadata: AgendaMetadata) => {
      const nominationFileIds = state.selectedFileIds;
      if (!nominationFileIds || nominationFileIds.length === 0) {
        const { isConfirmed } = await waitForConfirmation({
          title: 'Sélection manquante',
          content: 'Merci de sélectionner au moins une proposition avant de continuer',
          i18n: { confirm: "Retourner à l'étape 1", cancel: 'Rester sur cette étape' },
        });
        if (isConfirmed) goToFiles();
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
                <FormattedMessage defaultMessage={'Êtes-vous sûr de vouloir continuer\u00A0?'} />
              </p>
            </>
          ),
        });

        if (!isConfirmed) return;
      }

      const payload = {
        nominationFileIds,
        chairmanId: metadata.chairmanId,
        date: metadata.date,
        sessionMeetingDate: metadata.sessionMeetingDate,
      };

      async function onSuccess(result: { id: string } | undefined) {
        await queryClient.invalidateQueries({
          queryKey: agendaKeys.findAgendaNominationFiles({ sessionId }),
        });

        const id = result?.id || agendaId;
        if (!agendaId) basket.clear();
        if (id) {
          await queryClient.invalidateQueries({ queryKey: agendaKeys.agendaHtml(id) });
          return navigate(generatePath(ROUTE_PATHS.SG.AGENDA_PREVIEW, { sessionId, agendaId: id }));
        }
      }

      setState((s) => ({ ...s, metadata }));

      if (agendaId) {
        resetAgenda.mutate(undefined, {
          onSuccess: () => updateAgenda.mutate({ ...payload, agendaId }, { onSuccess }),
        });
      } else {
        createAgenda.mutate({ ...payload, sessionId }, { onSuccess });
      }
    },
    [
      state.selectedFileIds,
      goToFiles,
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
      basket,
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
        selectedFileIds: state.selectedFileIds,
        metadata: state.metadata,
        isSubmitting: createAgenda.isPending || updateAgenda.isPending,
        goToFiles,
        goToMetadata,
        submit,
        cancel,
      }}
    >
      {isFetching ? <span className="ri-loader-4-line animate-spin" /> : props.children}
    </AgendaContext>
  );
}
